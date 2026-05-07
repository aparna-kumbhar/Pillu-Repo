const express = require("express");
const Institute = require("../Models/Institute");
const razorpay = require("../Config/razorpayConfig");

const router = express.Router();

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

const createRazorpayDetails = async ({ bankAccount, email, phone, existingRazorpayDetails }) => {
	const razorpayDetails = {
		accountId: null,
		contactId: existingRazorpayDetails?.contactId || null,
		fundAccountId: null,
		accountStatus: "pending",
		lastError: "",
	};

	if (!bankAccount?.accountHolderName) {
		return razorpayDetails;
	}

	try {
		console.log('🔄 Creating Razorpay account for bank details...');

		if (!razorpay) {
			console.warn('⚠️ Razorpay not initialized - skipping contact/fund account creation');
			return razorpayDetails;
		}

		if (!razorpay.customers?.create || !razorpay.fundAccount?.create) {
			console.warn('⚠️ Razorpay customer/fund account APIs unavailable - skipping Razorpay setup');
			return razorpayDetails;
		}

		const customerResponse = razorpayDetails.contactId
			? await razorpay.customers.fetch(razorpayDetails.contactId)
			: await createRazorpayCustomer({ bankAccount, email, phone });
		razorpayDetails.contactId = customerResponse.id;
		console.log('✅ Razorpay Customer ready:', customerResponse.id);

		const fundAccountResponse = await createRazorpayFundAccount({
			customerId: customerResponse.id,
			bankAccount,
		});
		razorpayDetails.fundAccountId = fundAccountResponse.id;
		razorpayDetails.accountStatus = "active";
		console.log('✅ Razorpay Fund Account created:', fundAccountResponse.id);
	} catch (razorpayError) {
		const razorpayErrorMessage = getRazorpayErrorMessage(razorpayError);
		console.error('⚠️ Razorpay integration error (proceeding with bank details):', razorpayErrorMessage);
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

		return res.status(200).json({
			message: "Admin login successful",
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
