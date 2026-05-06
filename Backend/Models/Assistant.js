const mongoose = require("mongoose");

const assistantSchema = new mongoose.Schema(
	{
		instituteId: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		instituteName: {
			type: String,
			trim: true,
			default: "",
		},
		assistantName: {
			type: String,
			required: true,
			trim: true,
		},
		qualification: {
			type: String,
			trim: true,
			default: "",
		},
		dateOfBirth: {
			type: String,
			trim: true,
			default: "",
		},
		password: {
			type: String,
			trim: true,
			default: "",
		},
		phoneNumber: {
			type: String,
			trim: true,
			default: "",
		},
		yearOfExperience: {
			type: String,
			trim: true,
			default: "",
		},
		department: {
			type: String,
			trim: true,
			default: "",
		},
		address: {
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
		notes: {
			type: String,
			trim: true,
			default: "",
		},
		createdBy: {
			adminName: { type: String, trim: true, default: "" },
			email: { type: String, trim: true, lowercase: true, default: "" },
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

// Index for unique assistant per institute
assistantSchema.index({ instituteId: 1, assistantName: 1 }, { unique: true });

module.exports = mongoose.model("Assistant", assistantSchema);
