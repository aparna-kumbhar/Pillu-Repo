const mongoose = require("mongoose");

const teacherAttendanceRecordSchema = new mongoose.Schema(
	{
		teacherId: {
			type: String,
			required: true,
			trim: true,
		},
		teacherName: {
			type: String,
			trim: true,
			default: "",
		},
		role: {
			type: String,
			trim: true,
			default: "",
		},
		batch: {
			type: String,
			trim: true,
			default: "",
		},
		subject: {
			type: String,
			trim: true,
			default: "",
		},
		status: {
			type: String,
			enum: ["present", "absent", "late", "leave"],
			default: "present",
		},
		initials: {
			type: String,
			trim: true,
			default: "",
		},
		color: {
			type: String,
			trim: true,
			default: "#6B7280",
		},
	},
	{ _id: false }
);

const teacherAttendanceSchema = new mongoose.Schema(
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
		attendanceDate: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		teachersAttendance: {
			type: [teacherAttendanceRecordSchema],
			default: [],
		},
		totalTeachers: {
			type: Number,
			default: 0,
		},
		presentCount: {
			type: Number,
			default: 0,
		},
		absentCount: {
			type: Number,
			default: 0,
		},
		lateCount: {
			type: Number,
			default: 0,
		},
		leaveCount: {
			type: Number,
			default: 0,
		},
		markedBy: {
			adminName: { type: String, trim: true, default: "" },
			email: { type: String, trim: true, lowercase: true, default: "" },
		},
	},
	{ timestamps: true }
);

teacherAttendanceSchema.index({ instituteId: 1, attendanceDate: 1 }, { unique: true });

module.exports = mongoose.models.TeacherAttendance || mongoose.model("TeacherAttendance", teacherAttendanceSchema);