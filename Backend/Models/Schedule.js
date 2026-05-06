const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
	{
		day: { type: String, required: true, trim: true },
		startTime: { type: String, required: true, trim: true },
		endTime: { type: String, required: true, trim: true },
		subject: {
			id: { type: String, trim: true, default: "" },
			label: { type: String, trim: true, default: "" },
		},
		classroom: {
			id: { type: String, trim: true, default: "" },
			label: { type: String, trim: true, default: "" },
		},
		faculty: {
			id: { type: String, trim: true, default: "" },
			label: { type: String, trim: true, default: "" },
		},
		color: { type: String, trim: true, default: "green" },
	},
	{ _id: true }
);

const scheduleSchema = new mongoose.Schema(
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
		batch: {
			id: { type: String, required: true, trim: true, index: true },
			label: { type: String, trim: true, default: "" },
		},
		weekLabel: {
			type: String,
			trim: true,
			default: "",
		},
		sessions: {
			type: [sessionSchema],
			default: [],
		},
		createdBy: {
			adminName: { type: String, trim: true, default: "" },
			email: { type: String, trim: true, lowercase: true, default: "" },
		},
	},
	{ timestamps: true }
);

scheduleSchema.index({ instituteId: 1, "batch.id": 1, createdAt: -1 });

module.exports = mongoose.model("Schedule", scheduleSchema);
