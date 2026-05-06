const mongoose = require("mongoose");

const questionOptionSchema = new mongoose.Schema(
	{
		id: { type: String, trim: true, default: "" },
		text: { type: String, trim: true, default: "" },
		isCorrect: { type: Boolean, default: false },
	},
	{ _id: false }
);

const testQuestionSchema = new mongoose.Schema(
	{
		id: { type: String, trim: true, default: "" },
		questionType: { type: String, trim: true, default: "Multiple Choice" },
		points: { type: Number, default: 0 },
		prompt: { type: String, trim: true, default: "" },
		options: { type: [questionOptionSchema], default: [] },
	},
	{ _id: false }
);

const testSchema = new mongoose.Schema(
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
		title: {
			type: String,
			required: true,
			trim: true,
		},
		questionType: {
			type: String,
			trim: true,
			default: "Multiple Choice",
		},
		points: {
			type: Number,
			default: 0,
		},
		prompt: {
			type: String,
			trim: true,
			default: "",
		},
		questions: {
			type: Number,
			default: 0,
		},
		questionsArray: {
			type: [testQuestionSchema],
			default: [],
		},
		status: {
			type: String,
			trim: true,
			default: "DRAFT",
		},
		date: {
			type: String,
			trim: true,
			default: "",
		},
		author: {
			type: String,
			trim: true,
			default: "",
		},
		emoji: {
			type: String,
			trim: true,
			default: "❓",
		},
		createdBy: {
			adminName: { type: String, trim: true, default: "" },
			email: { type: String, trim: true, lowercase: true, default: "" },
		},
	},
	{ timestamps: true }
);

testSchema.index({ instituteId: 1, createdAt: -1 });

testSchema.index({ instituteId: 1, title: 1 }, { unique: false });

module.exports = mongoose.models.Test || mongoose.model("Test", testSchema);
