const mongoose = require("mongoose");

const examMarksSchema = new mongoose.Schema(
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
		batchId: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		batchName: {
			type: String,
			trim: true,
			default: "",
		},
		examName: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		subject: {
			type: String,
			required: true,
			trim: true,
		},
		subjectCode: {
			type: String,
			trim: true,
			default: "",
		},
		studentId: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		studentName: {
			type: String,
			required: true,
			trim: true,
		},
		studentRoll: {
			type: String,
			trim: true,
			default: "",
		},
		marks: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		totalMarks: {
			type: Number,
			required: true,
			default: 100,
			min: 0,
		},
		percentage: {
			type: Number,
			default: 0,
		},
		grade: {
			type: String,
			trim: true,
			default: "",
		},
		remarks: {
			type: String,
			trim: true,
			default: "",
		},
		published: {
			type: Boolean,
			default: false,
		},
		createdBy: {
			adminName: { type: String, trim: true, default: "" },
			email: { type: String, trim: true, default: "" },
		},
		updatedBy: {
			adminName: { type: String, trim: true, default: "" },
			email: { type: String, trim: true, default: "" },
		},
	},
	{ timestamps: true }
);

// Compound index for uniqueness per institute-batch-exam-student
examMarksSchema.index(
	{ instituteId: 1, batchId: 1, examName: 1, studentId: 1 },
	{ unique: true, sparse: true }
);

// Auto-calculate percentage and grade
examMarksSchema.pre("save", function (next) {
	if (this.totalMarks > 0) {
		this.percentage = (this.marks / this.totalMarks) * 100;

		// Calculate grade based on percentage
		if (this.percentage >= 90) {
			this.grade = "A";
		} else if (this.percentage >= 80) {
			this.grade = "B";
		} else if (this.percentage >= 70) {
			this.grade = "C";
		} else if (this.percentage >= 60) {
			this.grade = "D";
		} else if (this.percentage >= 50) {
			this.grade = "E";
		} else {
			this.grade = "F";
		}
	}
	next();
});

module.exports = mongoose.model("ExamMarks", examMarksSchema);
