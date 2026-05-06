const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
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
		fullName: {
			type: String,
			required: true,
			trim: true,
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
		studentPassword: {
			type: String,
			trim: true,
			default: "",
		},
		parentPassword: {
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
		parentPhoneNumber: {
			type: String,
			trim: true,
			default: "",
		},
		studentId: {
			type: String,
			trim: true,
			default: "",
		},
		studentPhoneNumber: {
			type: String,
			trim: true,
			default: "",
		},
		advancedFeePayment: {
			type: String,
			trim: true,
			default: "",
		},
		address: {
			type: String,
			trim: true,
			default: "",
		},
		studentEmail : {
			type: String,
			trim: true,
			lowercase: true,
			default: "",
		},
		studentPhoto: {
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

studentSchema.index({ instituteId: 1, createdAt: -1 });

module.exports = mongoose.model.Student || mongoose.model("Student", studentSchema);