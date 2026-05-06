const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
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
			trim: true,
			default: "",
		},
		studentName: {
			type: String,
			trim: true,
			default: "",
		},
		subject: {
			type: String,
			trim: true,
			default: "General",
		},
		department: {
			type: String,
			trim: true,
			default: "",
		},
		rating: {
			type: Number,
			min: 1,
			max: 5,
			default: 5,
		},
		feedbackText: {
			type: String,
			required: true,
			trim: true,
		},
		tags: {
			type: [String],
			default: [],
		},
		createdBy: {
			name: { type: String, trim: true, default: "" },
			email: { type: String, trim: true, lowercase: true, default: "" },
		},
	},
	{ timestamps: true }
);

feedbackSchema.index({ instituteId: 1, createdAt: -1 });

module.exports = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);