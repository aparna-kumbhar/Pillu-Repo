const mongoose = require("mongoose");

const batchMemberSchema = new mongoose.Schema(
	{
		id: { type: String, trim: true, default: "" },
		name: { type: String, trim: true, default: "" },
		grade: { type: String, trim: true, default: "" },
		avatar: { type: String, trim: true, default: "" },
	},
	{ _id: false }
);

const facultySchema = new mongoose.Schema(
	{
		id: { type: String, trim: true, default: "" },
		name: { type: String, trim: true, default: "" },
		subject: { type: String, trim: true, default: "" },
		exp: { type: String, trim: true, default: "" },
		avatar: { type: String, trim: true, default: "" },
	},
	{ _id: false }
);

const allocatedTeacherSchema = new mongoose.Schema(
	{
		id: { type: String, trim: true, default: "" },
		name: { type: String, trim: true, default: "" },
		subject: { type: String, trim: true, default: "" },
		exp: { type: String, trim: true, default: "" },
		avatar: { type: String, trim: true, default: "" },
	},
	{ _id: false }
);

const batchSchema = new mongoose.Schema(
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
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
			default: "",
		},
		capacity: {
			type: Number,
			required: true,
			min: 1,
		},
		startDate: {
			type: Date,
			default: Date.now,
		},
		type: {
			type: String,
			trim: true,
			default: "Regular",
		},
		subjects: {
			type: [String],
			default: [],
		},
		students: {
			type: [batchMemberSchema],
			default: [],
		},
		allocatedTeachers: {
			type: [allocatedTeacherSchema],
			default: [],
		},
		faculty: {
			type: facultySchema,
			default: () => ({}),
		},
		createdBy: {
			adminName: { type: String, trim: true, default: "" },
			email: { type: String, trim: true, lowercase: true, default: "" },
		},
	},
	{ timestamps: true }
);

batchSchema.index({ instituteId: 1, createdAt: -1 });

module.exports = mongoose.model("Batch", batchSchema);