const express = require("express");
const Institute = require("../Models/Institute");
const razorpay = require("../Config/razorpayConfig");

const router = express.Router();

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
		const institute = await Institute.findById(req.params.id);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}
		res.status(200).json(institute);
	} catch (error) {
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
			return res.status(404).json({ message: "Institute not found" });
		}

		// Check if new instituteId already exists (if changed)
		if (instituteId && instituteId !== existingInstitute.instituteId) {
			const duplicate = await Institute.findOne({ instituteId });
			if (duplicate) {
				return res.status(409).json({ message: "Institute ID already exists" });
			}
		}

		// Build update object
		const updateData = {
			name: name ? name.trim() : existingInstitute.name,
			location: location ? location.trim() : existingInstitute.location,
			instituteId: instituteId ? instituteId.trim() : existingInstitute.instituteId,
			adminName: adminName ? adminName.trim() : existingInstitute.adminName,
			email: email ? email.trim() : existingInstitute.email,
			phone: phone ? phone.trim() : existingInstitute.phone,
			pricePerUser: pricePerUser ? pricePerUser.trim() : existingInstitute.pricePerUser,
		};

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
		}

		const updatedInstitute = await Institute.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

		console.log('✅ Institute updated successfully:', updatedInstitute._id);
		res.status(200).json(updatedInstitute);
	} catch (error) {
		console.error('❌ Update error:', error.message);
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
			amount: amount || institute.payment?.amount || "$39.99",
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

		// Prepare Razorpay details if bank account is provided
		let razorpayDetails = {
			accountId: null,
			contactId: null,
			fundAccountId: null,
			accountStatus: "pending",
		};

		if (bankAccount && bankAccount.accountHolderName) {
			try {
				console.log('🔄 Creating Razorpay account for bank details...');
				
				// Check if Razorpay is initialized
				if (!razorpay) {
					console.warn('⚠️ Razorpay not initialized - skipping contact/fund account creation');
					razorpayDetails.accountStatus = "pending";
				} else {
					// Create Contact in Razorpay
					const contactPayload = {
						type: "account",
						name: bankAccount.accountHolderName,
						email: email,
						contact_email: email,
						contact_mobile: phone,
					};

					const contactResponse = await razorpay.contacts.create(contactPayload);
					razorpayDetails.contactId = contactResponse.id;
					console.log('✅ Razorpay Contact created:', contactResponse.id);

					// Create Fund Account for bank transfer
					const fundAccountPayload = {
						contact_id: contactResponse.id,
						account_type: "bank_account",
						bank_account: {
							name: bankAccount.accountHolderName,
							account_number: bankAccount.accountNumber,
							ifsc: bankAccount.ifscCode,
						},
					};

					const fundAccountResponse = await razorpay.fundAccounts.create(fundAccountPayload);
					razorpayDetails.fundAccountId = fundAccountResponse.id;
					console.log('✅ Razorpay Fund Account created:', fundAccountResponse.id);

					razorpayDetails.accountStatus = "active";
				}
			} catch (razorpayError) {
				console.error('⚠️ Razorpay integration error (proceeding with bank details):', razorpayError.message);
				razorpayDetails.accountStatus = "failed";
				// Don't fail registration if Razorpay fails - save bank details anyway
			}
		}

		const newInstitute = await Institute.create({
			name: trimmedName,
			location: trimmedLocation,
			instituteId: trimmedInstituteId,
			institutePassword: trimmedPassword,
			joinDate: parsedJoinDate,
			adminName,
			email,
			phone,
			pricePerUser,
			modules,
			bankAccount: bankAccount || {
				accountHolderName: "",
				accountNumber: "",
				ifscCode: "",
				bankName: "",
				accountType: "savings",
			},
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
