const express = require("express");
const crypto = require("crypto");
const Institute = require("../Models/Institute");
const Student = require("../Models/Student");
const Teacher = require("../Models/Teacher");
const Assistant = require("../Models/Assistant");
const Parent = require("../Models/Parent");
const razorpay = require("../Config/razorpayConfig");

const router = express.Router();
const { generateToken } = require('../Middleware/authMiddleware');

const parseRupeeAmount = (value) => {
	const cleaned = String(value || "").replace(/[^0-9.]/g, "");
	const parsed = Number.parseFloat(cleaned);
	return Number.isFinite(parsed) ? parsed : 0;
};

const formatRupees = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

const getNextMonthlyDueDate = () => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

const buildSubscriptionSummary = async (instituteId) => {
	const institute = await Institute.findOne({ instituteId });
	if (!institute) return null;

	const [students, teachers, assistants, parents] = await Promise.all([
		Student.countDocuments({ instituteId }),
		Teacher.countDocuments({ instituteId }),
		Assistant.countDocuments({ instituteId }),
		Parent.countDocuments({ instituteId }),
	]);

	const pricePerUser = parseRupeeAmount(institute.pricePerUser);
	const userBreakdown = { students, teachers, assistants, parents };
	const userCount = students; // Only charge for students
	const monthlyAmount = pricePerUser * userCount;

	let payment = institute.payment || {};

	// If the due date has passed, the subscription for the new month is pending
	if (payment.dueDate && new Date() >= new Date(payment.dueDate) && payment.status === 'completed') {
		payment.status = 'pending';
		await Institute.findByIdAndUpdate(institute._id, { 'payment.status': 'pending' });
	}

	return {
		institute,
		pricePerUser,
		userCount,
		userBreakdown,
		monthlyAmount,
		payment,
	};
};

const getRazorpayErrorMessage = (error) => {
	if (!error) return "Unknown Razorpay error";
	if (typeof error === "string") return error;
	if (error.error?.description) return error.error.description;
	if (error.error?.reason) return error.error.reason;
	if (error.description) return error.description;
	if (error.message) return error.message;

	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
};

const findExistingRazorpayCustomer = async ({ email, phone }) => {
	if (!razorpay?.customers?.all) return null;

	const response = await razorpay.customers.all({ count: 100 });
	const customers = response?.items || [];
	const normalizedEmail = (email || "").trim().toLowerCase();
	const normalizedPhone = String(phone || "").trim();

	return customers.find((customer) => {
		const customerEmail = (customer.email || "").trim().toLowerCase();
		const customerContact = String(customer.contact || "").trim();
		return (
			(normalizedEmail && customerEmail === normalizedEmail) ||
			(normalizedPhone && customerContact === normalizedPhone)
		);
	}) || null;
};

const createRazorpayCustomer = async ({ bankAccount, email, phone }) => {
	const customerPayload = {
		name: bankAccount.accountHolderName,
		email,
		contact: phone,
		fail_existing: 0,
	};

	try {
		return await razorpay.customers.create(customerPayload);
	} catch (error) {
		const errorMessage = getRazorpayErrorMessage(error);
		if (!/Customer already exists/i.test(errorMessage)) {
			throw error;
		}

		const existingCustomer = await findExistingRazorpayCustomer({ email, phone });
		if (!existingCustomer) {
			throw error;
		}

		console.log('✅ Reusing existing Razorpay Customer:', existingCustomer.id);
		return existingCustomer;
	}
};

const findExistingRazorpayFundAccount = async ({ customerId, bankAccount }) => {
	if (!razorpay?.fundAccount?.fetch) return null;

	const response = await razorpay.fundAccount.fetch(customerId);
	const fundAccounts = response?.items || [];
	const normalizedIfsc = (bankAccount.ifscCode || "").trim().toUpperCase();
	const normalizedName = (bankAccount.accountHolderName || "").trim().toLowerCase();
	const accountLast4 = String(bankAccount.accountNumber || "").slice(-4);

	return fundAccounts.find((fundAccount) => {
		const account = fundAccount.bank_account || {};
		const sameIfsc = !normalizedIfsc || (account.ifsc || "").trim().toUpperCase() === normalizedIfsc;
		const sameName = !normalizedName || (account.name || "").trim().toLowerCase() === normalizedName;
		const sameAccount = !accountLast4 || String(account.account_number || "").endsWith(accountLast4);
		return fundAccount.account_type === "bank_account" && sameIfsc && sameName && sameAccount;
	}) || fundAccounts.find((fundAccount) => fundAccount.account_type === "bank_account") || null;
};

const createRazorpayFundAccount = async ({ customerId, bankAccount }) => {
	const fundAccountPayload = {
		customer_id: customerId,
		account_type: "bank_account",
		bank_account: {
			name: bankAccount.accountHolderName,
			account_number: bankAccount.accountNumber,
			ifsc: bankAccount.ifscCode,
		},
	};

	try {
		return await razorpay.fundAccount.create(fundAccountPayload);
	} catch (error) {
		const errorMessage = getRazorpayErrorMessage(error);
		if (!/already exists/i.test(errorMessage)) {
			throw error;
		}

		const existingFundAccount = await findExistingRazorpayFundAccount({ customerId, bankAccount });
		if (!existingFundAccount) {
			throw error;
		}

		console.log('✅ Reusing existing Razorpay Fund Account:', existingFundAccount.id);
		return existingFundAccount;
	}
};

const createRazorpayDetails = async ({ bankAccount, email, phone, existingRazorpayDetails, adminName }) => {
	const razorpayDetails = {
		accountId: existingRazorpayDetails?.accountId || null,
		contactId: existingRazorpayDetails?.contactId || null,
		fundAccountId: existingRazorpayDetails?.fundAccountId || null,
		accountStatus: existingRazorpayDetails?.accountStatus || "pending",
		lastError: "",
	};

	if (!bankAccount?.accountHolderName) {
		return razorpayDetails;
	}

	try {
		console.log('🔄 Creating Razorpay Route Account...');

		if (!razorpay) {
			console.warn('⚠️ Razorpay not initialized - skipping account creation');
			return razorpayDetails;
		}

		if (!razorpay.accounts?.create) {
			console.warn('⚠️ Razorpay accounts API unavailable - skipping Razorpay setup');
			return razorpayDetails;
		}

		if (razorpayDetails.accountId) {
			console.log('✅ Reusing existing Razorpay Route Account:', razorpayDetails.accountId);
			return razorpayDetails;
		}

		const accountPayload = {
			email: email || "admin@example.com",
			phone: phone || "0000000000",
			type: "route",
			reference_id: `inst_${Date.now()}`,
			legal_business_name: bankAccount.accountHolderName,
			business_type: "individual",
			contact_name: adminName || bankAccount.accountHolderName || "Admin",
			profile: {
				category: "education",
				subcategory: "coaching",
				addresses: {
					registered: {
						street1: "N/A",
						city: "N/A",
						state: "MH",
						postal_code: "400001",
						country: "IN"
					}
				}
			}
		};

		const accountResponse = await razorpay.accounts.create(accountPayload);
		razorpayDetails.accountId = accountResponse.id;
		razorpayDetails.accountStatus = "active";
		console.log('✅ Razorpay Route Account created:', accountResponse.id);
	} catch (razorpayError) {
		const razorpayErrorMessage = getRazorpayErrorMessage(razorpayError);
		console.error('⚠️ Razorpay Route integration error:', razorpayErrorMessage);
		console.error('Razorpay error details:', razorpayError);
		razorpayDetails.accountStatus = "failed";
		razorpayDetails.lastError = razorpayErrorMessage;
	}

	return razorpayDetails;
};

// GET all institutes
router.get("/", async (req, res) => {
	try {
		const institutes = await Institute.find().sort({ createdAt: -1 });
		res.status(200).json(institutes);
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch institutes", error: error.message });
	}
});

router.get("/:instituteId/subscription", async (req, res) => {
	try {
		const instituteId = (req.params.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const summary = await buildSubscriptionSummary(instituteId);
		if (!summary) {
			return res.status(404).json({ message: "Institute not found" });
		}

		return res.status(200).json({
			instituteId: summary.institute.instituteId,
			instituteName: summary.institute.name,
			pricePerUser: summary.pricePerUser,
			userCount: summary.userCount,
			userBreakdown: summary.userBreakdown,
			monthlyAmount: summary.monthlyAmount,
			payment: summary.payment,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to load subscription", error: error.message });
	}
});

router.post("/:instituteId/subscription/order", async (req, res) => {
	try {
		const instituteId = (req.params.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		if (!razorpay?.orders?.create) {
			return res.status(503).json({ message: "Razorpay is not configured on the server" });
		}

		const summary = await buildSubscriptionSummary(instituteId);
		if (!summary) {
			return res.status(404).json({ message: "Institute not found" });
		}

		if (summary.pricePerUser <= 0) {
			return res.status(400).json({ message: "Per-user price is not configured for this institute" });
		}

		if (summary.userCount <= 0) {
			return res.status(400).json({ message: "No billable users found for this institute" });
		}

		const amountInPaise = Math.round(summary.monthlyAmount * 100);
		const receipt = `sub_${Date.now().toString(36)}_${instituteId}`.slice(0, 40);
		const order = await razorpay.orders.create({
			amount: amountInPaise,
			currency: "INR",
			receipt,
			notes: {
				instituteId,
				userCount: String(summary.userCount),
				pricePerUser: String(summary.pricePerUser),
				billingType: "monthly_subscription",
			},
		});

		await Institute.findOneAndUpdate(
			{ instituteId },
			{
				payment: {
					status: "pending",
					amount: formatRupees(summary.monthlyAmount),
					dueDate: summary.payment?.dueDate || new Date(),
					paidDate: summary.payment?.paidDate || null,
					transactionId: order.id,
					notes: `Razorpay order created for ${summary.userCount} users`,
				},
			},
			{ new: true }
		);

		return res.status(201).json({
			keyId: process.env.RAZORPAY_KEY_ID,
			order,
			subscription: {
				pricePerUser: summary.pricePerUser,
				userCount: summary.userCount,
				userBreakdown: summary.userBreakdown,
				monthlyAmount: summary.monthlyAmount,
			},
		});
	} catch (error) {
		return res.status(500).json({
			message: "Failed to create Razorpay order",
			error: getRazorpayErrorMessage(error),
		});
	}
});

router.post("/:instituteId/subscription/verify", async (req, res) => {
	try {
		const instituteId = (req.params.instituteId || "").trim();
		const {
			razorpay_order_id,
			razorpay_payment_id,
			razorpay_signature,
		} = req.body || {};

		if (!instituteId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
			return res.status(400).json({
				message: "instituteId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
			});
		}

		if (!process.env.RAZORPAY_KEY_SECRET) {
			return res.status(503).json({ message: "Razorpay secret is not configured on the server" });
		}

		const generatedSignature = crypto
			.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
			.update(`${razorpay_order_id}|${razorpay_payment_id}`)
			.digest("hex");

		const expectedSignature = Buffer.from(generatedSignature);
		const receivedSignature = Buffer.from(String(razorpay_signature));
		const signatureMatches =
			expectedSignature.length === receivedSignature.length &&
			crypto.timingSafeEqual(expectedSignature, receivedSignature);

		if (!signatureMatches) {
			await Institute.findOneAndUpdate(
				{ instituteId },
				{
					"payment.status": "failed",
					"payment.transactionId": razorpay_payment_id,
					"payment.notes": "Razorpay signature verification failed",
				}
			);
			return res.status(400).json({ message: "Payment verification failed" });
		}

		if (!razorpay?.orders?.fetch) {
			return res.status(503).json({ message: "Razorpay order verification is unavailable" });
		}

		const order = await razorpay.orders.fetch(razorpay_order_id);
		if (String(order?.notes?.instituteId || "").trim() !== instituteId) {
			await Institute.findOneAndUpdate(
				{ instituteId },
				{
					"payment.status": "failed",
					"payment.transactionId": razorpay_payment_id,
					"payment.notes": "Razorpay order does not belong to this institute",
				}
			);
			return res.status(400).json({ message: "Payment order does not match this institute" });
		}

		const paidAmount = order?.amount ? Number(order.amount) / 100 : 0;
		const updatedInstitute = await Institute.findOneAndUpdate(
			{ instituteId },
			{
				payment: {
					status: "completed",
					amount: formatRupees(paidAmount),
					dueDate: getNextMonthlyDueDate(),
					paidDate: new Date(),
					transactionId: razorpay_payment_id,
					notes: `Verified Razorpay order ${razorpay_order_id}`,
				},
			},
			{ new: true }
		);

		if (!updatedInstitute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		return res.status(200).json({
			message: "Subscription payment verified",
			payment: updatedInstitute.payment,
		});
	} catch (error) {
		return res.status(500).json({
			message: "Failed to verify payment",
			error: getRazorpayErrorMessage(error),
		});
	}
});

router.get("/:id", async (req, res) => {
	try {
		console.log('📋 GET /institutes/:id - Fetch single institute');
		console.log('Institute ID:', req.params.id);
		
		const institute = await Institute.findById(req.params.id);
		if (!institute) {
			console.warn('⚠️ Institute not found:', req.params.id);
			return res.status(404).json({ message: "Institute not found" });
		}
		
		console.log('✅ Institute found:', institute._id);
		res.status(200).json(institute);
	} catch (error) {
		console.error('❌ Error fetching institute:', error.message);
		res.status(500).json({ message: "Failed to fetch institute", error: error.message });
	}
});

// PUT - Update institute details
router.put("/:id", async (req, res) => {
	try {
		console.log('📋 PUT /institutes/:id - Update institute');
		console.log('Institute ID:', req.params.id);
		console.log('Request body:', JSON.stringify(req.body, null, 2));

		const {
			name,
			location,
			instituteId,
			adminName,
			email,
			phone,
			pricePerUser,
			modules,
			bankAccount,
		} = req.body;

		// Find existing institute
		const existingInstitute = await Institute.findById(req.params.id);
		if (!existingInstitute) {
			console.error('❌ Institute not found with ID:', req.params.id);
			return res.status(404).json({ message: "Institute not found" });
		}

		console.log('✅ Found existing institute:', existingInstitute._id);

		// Check if new instituteId already exists (if changed)
		if (instituteId && instituteId !== existingInstitute.instituteId) {
			const duplicate = await Institute.findOne({ instituteId });
			if (duplicate) {
				console.error('❌ Duplicate instituteId:', instituteId);
				return res.status(409).json({ message: "Institute ID already exists" });
			}
		}

		// Build update object with only provided fields
		const updateData = {};
		
		if (name) updateData.name = name.trim();
		if (location) updateData.location = location.trim();
		if (instituteId) updateData.instituteId = instituteId.trim();
		if (adminName) updateData.adminName = adminName.trim();
		if (email) updateData.email = email.trim();
		if (phone) updateData.phone = phone.trim();
		if (pricePerUser !== undefined) updateData.pricePerUser = String(pricePerUser).trim();

		// Update modules if provided
		if (modules) {
			updateData.modules = {
				studentPortal: modules.studentPortal !== undefined ? modules.studentPortal : existingInstitute.modules.studentPortal,
				teacherPortal: modules.teacherPortal !== undefined ? modules.teacherPortal : existingInstitute.modules.teacherPortal,
				parentPortal: modules.parentPortal !== undefined ? modules.parentPortal : existingInstitute.modules.parentPortal,
				adminPortal: modules.adminPortal !== undefined ? modules.adminPortal : existingInstitute.modules.adminPortal,
			};
		}

		// Update bank account if provided
		if (bankAccount) {
			updateData.bankAccount = {
				accountHolderName: bankAccount.accountHolderName || existingInstitute.bankAccount?.accountHolderName || "",
				accountNumber: bankAccount.accountNumber || existingInstitute.bankAccount?.accountNumber || "",
				ifscCode: bankAccount.ifscCode || existingInstitute.bankAccount?.ifscCode || "",
				bankName: bankAccount.bankName || existingInstitute.bankAccount?.bankName || "",
				accountType: bankAccount.accountType || existingInstitute.bankAccount?.accountType || "savings",
			};

			const currentEmail = updateData.email || existingInstitute.email;
			const currentPhone = updateData.phone || existingInstitute.phone;
				updateData.razorpayDetails = await createRazorpayDetails({
					bankAccount: updateData.bankAccount,
					email: currentEmail,
					phone: currentPhone,
					existingRazorpayDetails: existingInstitute.razorpayDetails,
					adminName: updateData.adminName || existingInstitute.adminName,
				});
			}

		console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

		const updatedInstitute = await Institute.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

		console.log('✅ Institute updated successfully:', updatedInstitute._id);
		res.status(200).json(updatedInstitute);
	} catch (error) {
		console.error('❌ Update error:', error.message);
		if (error?.name === "CastError") {
			return res.status(400).json({ message: "Invalid institute ID format" });
		}
		res.status(500).json({ message: "Failed to update institute", error: error.message });
	}
});

// DELETE - Delete institute
router.delete("/:id", async (req, res) => {
	try {
		console.log('📋 DELETE /institutes/:id - Delete institute');
		console.log('Institute ID:', req.params.id);

		const institute = await Institute.findById(req.params.id);
		if (!institute) {
			console.error('❌ Institute not found:', req.params.id);
			return res.status(404).json({ message: "Institute not found" });
		}

		await Institute.findByIdAndDelete(req.params.id);

		console.log('✅ Institute deleted successfully:', req.params.id);
		res.status(200).json({ 
			message: "Institute deleted successfully",
			deletedId: req.params.id,
			deletedName: institute.name
		});
	} catch (error) {
		console.error('❌ Delete error:', error.message);
		if (error?.name === "CastError") {
			return res.status(400).json({ message: "Invalid institute ID format" });
		}
		res.status(500).json({ message: "Failed to delete institute", error: error.message });
	}
});

// PATCH - Update payment status
router.patch("/:id/payment", async (req, res) => {
	try {
		console.log('📋 PATCH /institutes/:id/payment - Update payment status');
		console.log('Institute ID:', req.params.id);
		console.log('Payment data:', JSON.stringify(req.body, null, 2));

		const { status, amount, dueDate, paidDate, transactionId, notes } = req.body;

		const institute = await Institute.findById(req.params.id);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		// Validate payment status
		if (status && !["pending", "completed", "failed", "overdue"].includes(status)) {
			return res.status(400).json({ message: "Invalid payment status" });
		}

		const updatePayment = {
			status: status || institute.payment?.status || "pending",
			amount: amount || institute.payment?.amount || "₹0",
			dueDate: dueDate || institute.payment?.dueDate,
			paidDate: paidDate || institute.payment?.paidDate,
			transactionId: transactionId || institute.payment?.transactionId,
			notes: notes || institute.payment?.notes || "",
		};

		const updatedInstitute = await Institute.findByIdAndUpdate(
			req.params.id,
			{ payment: updatePayment },
			{ new: true, runValidators: true }
		);

		console.log('✅ Payment status updated:', updatePayment.status);
		res.status(200).json(updatedInstitute);
	} catch (error) {
		console.error('❌ Payment update error:', error.message);
		res.status(500).json({ message: "Failed to update payment", error: error.message });
	}
});

router.post("/admin-login", async (req, res) => {
	try {
		const instituteId = (req.body?.adminId || req.body?.instituteId || "").trim();
		const institutePassword = (req.body?.adminPassword || req.body?.institutePassword || "").trim();

		if (!instituteId || !institutePassword) {
			return res.status(400).json({
				message: "adminId/adminPassword (or instituteId/institutePassword) are required",
			});
		}

		const institute = await Institute.findOne({ instituteId });
		if (!institute || institute.institutePassword !== institutePassword) {
			return res.status(401).json({ message: "Invalid admin ID or password" });
		}

		const token = generateToken({
			id: institute._id,
			role: 'admin',
			instituteId: institute.instituteId,
		});

		return res.status(200).json({
			message: "Admin login successful",
			token,
			institute: {
				id: institute._id,
				name: institute.name,
				adminId: institute.instituteId,
				instituteId: institute.instituteId,
				adminName: institute.adminName,
				email: institute.email,
				modules: institute.modules,
			},
		});
	} catch (error) {
		return res.status(500).json({ message: "Admin login failed", error: error.message });
	}
});

router.post("/register", async (req, res) => {
	try {
		console.log('📋 POST /register endpoint hit');
		console.log('Request body:', JSON.stringify(req.body, null, 2));
		
		const {
			name,
			location,
			instituteId,
			institutePassword,
			joinDate,
				adminName,
				email,
				phone,
				pricePerUser,
				modules,
				bankAccount,
			} = req.body;

		const trimmedName = (name || "").trim();
		const trimmedLocation = (location || "").trim();
		const trimmedInstituteId = (instituteId || "").trim();
		const trimmedPassword = (institutePassword || "").trim();

		console.log('Trimmed values:', { trimmedName, trimmedLocation, trimmedInstituteId, trimmedPassword });

		if (!trimmedName || !trimmedLocation || !trimmedInstituteId || !trimmedPassword) {
			const msg = "name, location, instituteId and institutePassword are required";
			console.error('❌ Validation failed:', msg);
			return res.status(400).json({
				message: msg,
			});
		}

		if (trimmedPassword.length < 6) {
			console.error('❌ Password too short');
			return res.status(400).json({
				message: "institutePassword must be at least 6 characters",
			});
		}

		console.log('✅ Basic validation passed');
		console.log('joinDate input:', joinDate);

		let parsedJoinDate;
		if (joinDate) {
			const dateCandidate = new Date(joinDate);
			console.log('dateCandidate:', dateCandidate);
			if (Number.isNaN(dateCandidate.getTime())) {
				console.error('❌ Invalid date format');
				return res.status(400).json({
					message: "joinDate is invalid. Use ISO format like 2026-04-19",
				});
			}
			parsedJoinDate = dateCandidate;
		}

		console.log('✅ Date validation passed, parsedJoinDate:', parsedJoinDate);

		const existingInstitute = await Institute.findOne({ instituteId: trimmedInstituteId });
		if (existingInstitute) {
			console.error('❌ Institute already exists');
			return res.status(409).json({ message: "Institute ID already exists" });
		}

		console.log('✅ Creating new institute...');

		const savedBankAccount = bankAccount || {
			accountHolderName: "",
			accountNumber: "",
			ifscCode: "",
			bankName: "",
			accountType: "savings",
		};
		const razorpayDetails = await createRazorpayDetails({
			bankAccount: savedBankAccount,
			email,
			phone,
			adminName,
		});

		const newInstitute = await Institute.create({
			name: trimmedName,
			location: trimmedLocation,
			instituteId: trimmedInstituteId,
			institutePassword: trimmedPassword,
			joinDate: parsedJoinDate,
				adminName,
				email,
				phone,
				pricePerUser: pricePerUser !== undefined ? String(pricePerUser).trim() : "",
				modules,
			bankAccount: savedBankAccount,
			razorpayDetails,
		});

		console.log('✅ Institute created successfully:', newInstitute);
		res.status(201).json(newInstitute);
	} catch (error) {
		if (error?.code === 11000) {
			return res.status(409).json({ message: "Institute ID already exists" });
		}

		if (error?.name === "ValidationError") {
			const messages = Object.values(error.errors || {})
				.map((item) => item.message)
				.filter(Boolean);
			return res.status(400).json({
				message: messages[0] || "Validation failed",
				error: error.message,
			});
		}

		res.status(500).json({ message: "Failed to register institute", error: error.message });
	}
});

module.exports = router;
