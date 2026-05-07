const mongoose = require("mongoose");

	const instituteSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		location: {
			type: String,
			required: true,
			trim: true,
		},
		instituteId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		institutePassword: {
			type: String,
			required: true,
			minlength: 6,
		},
		joinDate: {
			type: Date,
			default: Date.now,
		},
		adminName: {
			type: String,
			trim: true,
			default: "",
		},
		email: {
			type: String,
			trim: true,
			lowercase: true,
			default: "",
		},
		phone: {
			type: String,
			trim: true,
			default: "",
		},
		pricePerUser: {
			type: String,
			trim: true,
			default: "",
		},
		bankAccount: {
			accountHolderName: {
				type: String,
				trim: true,
				default: "",
			},
			accountNumber: {
				type: String,
				trim: true,
				default: "",
			},
			ifscCode: {
				type: String,
				trim: true,
				default: "",
			},
			bankName: {
				type: String,
				trim: true,
				default: "",
			},
			accountType: {
				type: String,
				enum: ["savings", "current"],
				default: "savings",
			},
		},
		razorpayDetails: {
			accountId: {
				type: String,
				default: null,
			},
			contactId: {
				type: String,
				default: null,
			},
			fundAccountId: {
				type: String,
				default: null,
			},
			accountStatus: {
				type: String,
				enum: ["pending", "active", "rejected"],
				default: "pending",
			},
		},
		modules: {
			studentPortal: { type: Boolean, default: true },
			teacherPortal: { type: Boolean, default: true },
			parentPortal: { type: Boolean, default: false },
			adminPortal: { type: Boolean, default: false },
		},
		payment: {
			status: {
				type: String,
				enum: ["pending", "completed", "failed", "overdue"],
				default: "pending",
			},
			amount: {
				type: String,
				default: "$39.99",
			},
			dueDate: {
				type: Date,
				default: null,
			},
			paidDate: {
				type: Date,
				default: null,
			},
			transactionId: {
				type: String,
				default: null,
			},
			notes: {
				type: String,
				default: "",
			},
		},
	},
	{ timestamps: true }
);module.exports = mongoose.model("Institute", instituteSchema);
