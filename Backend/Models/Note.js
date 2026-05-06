const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
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
		teacherId: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		teacherName: {
			type: String,
			trim: true,
			default: "",
		},
		title: {
			type: String,
			trim: true,
			default: "",
		},
		subject: {
			type: String,
			required: true,
			trim: true,
		},
		batch: {
			type: String,
			trim: true,
			default: "OPEN ACCESS",
		},
		fileName: {
			type: String,
			required: true,
			trim: true,
		},
		fileType: {
			type: String,
			trim: true,
			default: "",
		},
		mimeType: {
			type: String,
			trim: true,
			default: "",
		},
		fileSize: {
			type: Number,
			default: 0,
			min: 0,
		},
		fileUri: {
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

noteSchema.index({ instituteId: 1, createdAt: -1 });
noteSchema.index({ instituteId: 1, teacherId: 1, createdAt: -1 });

module.exports = mongoose.model("Note", noteSchema);
