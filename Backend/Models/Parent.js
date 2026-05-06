const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema(
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
		studentId: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		studentName: {
			type: String,
			trim: true,
			default: "",
		},
		parentId: {
			type: String,
			trim: true,
			default: "",
		},
		parentName: {
			type: String,
			trim: true,
			default: "",
		},
		parentEmail: {
			type: String,
			trim: true,
			lowercase: true,
			default: "",
		},
		parentPassword: {
			type: String,
			required: true,
			trim: true,
		},
		parentPhoneNumber: {
			type: String,
			trim: true,
			default: "",
		},
		address: {
			type: String,
			trim: true,
			default: "",
		},
		parentPhoto: {
			type: String,
			trim: true,
			default: "",
		},
		dateOfBirth: {
			type: String,
			trim: true,
			default: "",
		},
		academicYear: {
			type: String,
			trim: true,
			default: "",
		},
		createdBy: {
			adminName: { type: String, trim: true, default: "" },
			email: { type: String, trim: true, lowercase: true, default: "" },
		},
	},
	{ timestamps: true }
);

// ✅ Compound index for efficient querying
// parentId is the studentName, so (instituteId, parentId) uniquely identifies a parent
parentSchema.index({ instituteId: 1, studentId: 1 });
parentSchema.index({ instituteId: 1, parentId: 1 });

module.exports = mongoose.model("Parent", parentSchema);
