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
		modules: {
			studentPortal: { type: Boolean, default: true },
			teacherPortal: { type: Boolean, default: true },
			parentPortal: { type: Boolean, default: false },
			adminPortal: { type: Boolean, default: false },
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Institute", instituteSchema);
