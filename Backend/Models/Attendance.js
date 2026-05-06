const mongoose = require("mongoose");

const studentAttendanceSchema = new mongoose.Schema(
	{
		studentId: {
			type: String,
			required: true,
			trim: true,
		},
		studentName: {
			type: String,
			trim: true,
			default: "",
		},
		status: {
			type: String,
			enum: ["present", "absent", "leave"],
			default: "absent",
		},
	},
	{ _id: false }
);

const attendanceSchema = new mongoose.Schema(
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
		},
		teacherName: {
			type: String,
			trim: true,
			default: "",
		},
		date: {
			type: String,
			required: true,
			index: true,
		},
		subjectName: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		batchId: {
			type: String,
			trim: true,
			default: "",
			index: true,
		},
		batchName: {
			type: String,
			trim: true,
			default: "",
		},
		studentsAttendance: {
			type: [studentAttendanceSchema],
			default: [],
		},
		totalStudents: {
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
		leaveCount: {
			type: Number,
			default: 0,
		},
		notes: {
			type: String,
			trim: true,
			default: "",
		},
	},
	{ timestamps: true }
);

// ✅ Compound index for efficient querying by institute, date, and subject
attendanceSchema.index({ instituteId: 1, date: 1, subjectName: 1 });
attendanceSchema.index({ instituteId: 1, date: 1, batchId: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
