const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
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
		experience: {
			type: String,
			trim: true,
			default: "",
		},
		qualification: {
			type: String,
			trim: true,
			default: "",
		},
		teacherId: {
			type: String,
			trim: true,
			default: "",
		},
		teacherPassword: {
			type: String,
			trim: true,
			default: "",
		},
		departmentName: {
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

teacherSchema.index({ instituteId: 1, createdAt: -1 });

module.exports = mongoose.model("Teacher", teacherSchema);