const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const instituteRoutes = require("./Routes/instituteRoutes");
const notesRoutes = require("./Routes/notesRoutes");
const batchRoutes = require("./Routes/batchRoutes");
const testRoutes = require("./Routes/testRoutes");
const attendanceRoutes = require("./Routes/attendanceRoutes");
const teacherAttendanceRoutes = require("./Routes/teacherAttendanceRoutes");
const messageRoutes = require("./Routes/messageRoutes");
const Batch = require("./Models/Batch");
const Institute = require("./Models/Institute");
const Note = require("./Models/Note");
const Student = require("./Models/Student");
const Teacher = require("./Models/Teacher");
const Parent = require("./Models/Parent");
const Feedback = require("./Models/Feedback");
const Test = require("./Models/Test");
const Attendance = require("./Models/Attendance");
const TeacherAttendance = require("./Models/TeacherAttendance");
const Message = require("./Models/Message");
const TeacherRoutes = require("./Routes/teacherRoutes");
const StudentRoutes = require("./Routes/studentRoutes");
const ParentRoutes = require("./Routes/ParentRoutes");
const FeedbackRoutes = require("./Routes/FeedbackRoutes");
const ScheduleRoutes = require("./Routes/scheduleRoutes");
const Schedule = require("./Models/Schedule");
const AssistantRoutes = require("./Routes/assistantRoutes");
const Assistant = require("./Models/Assistant");
const MarksRoutes = require("./Routes/marksRoutes");
const ExamMarks = require("./Models/ExamMarks");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/coaching_db";

// ✅ CORS Configuration - Allow all origins for development
app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	credentials: false,
	allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
	res.status(200).json({ 
		status: 'Server is running', 
		port: PORT,
		timestamp: new Date().toISOString()
	});
});

app.use("/api/institutes", instituteRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/teacher-attendance", teacherAttendanceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/feedback", FeedbackRoutes);
app.use("/api/teachers", TeacherRoutes);
app.use("/api/students", StudentRoutes);
app.use("/api/parents", ParentRoutes);
app.use("/api/schedules", ScheduleRoutes);
app.use("/api/schedule", ScheduleRoutes);
app.use("/api/assistants", AssistantRoutes);
app.use("/api/marks", MarksRoutes);

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

const ensureCollections = async () => {
	await Promise.all([
		Institute.createCollection(),
		Note.createCollection(),
		Batch.createCollection(),
		Student.createCollection(),
		Parent.createCollection(),
		Teacher.createCollection(),
		Assistant.createCollection(),
		Feedback.createCollection(),
		Test.createCollection(),	
		Message.createCollection(),	
		Attendance.createCollection(),
		TeacherAttendance.createCollection(),
		Schedule.createCollection(),
		ExamMarks.createCollection(),
	]);
};

app.get("/api/students", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const createdByEmail = (req.query.createdByEmail || "").trim().toLowerCase();
		const createdByAdminName = (req.query.createdByAdminName || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const filter = { instituteId };
		if (createdByEmail) {
			filter["createdBy.email"] = createdByEmail;
		} else if (createdByAdminName) {
			filter["createdBy.adminName"] = createdByAdminName;
		}

		const students = await Student.find(filter).sort({ createdAt: -1 });
		return res.status(200).json(students);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch students", error: error.message });
	}
});

app.get("/api/students/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const student = await Student.findOne({ _id: req.params.id, instituteId });
		if (!student) {
			return res.status(404).json({ message: "Student not found" });
		}

		return res.status(200).json(student);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch student", error: error.message });
	}
});

app.post("/api/students", async (req, res) => {
	try {
		const payload = {
			instituteId: (req.body.instituteId || "").trim(),
			instituteName: "",
			fullName: (req.body.fullName || "").trim(),
			dateOfBirth: (req.body.dateOfBirth || "").trim(),
			academicYear: (req.body.academicYear || "").trim(),
			studentPassword: (req.body.studentPassword || "password").trim() || "password",
			parentId: (req.body.parentId || req.body.fullName || "").trim(),
			parentPassword: (req.body.parentPassword || "parentpassword").trim() || "parentpassword",
			parentPhoneNumber: (req.body.parentPhoneNumber || "").trim(),
			studentId: (req.body.studentId || req.body.fullName || "").trim(),
			studentPhoneNumber: (req.body.studentPhoneNumber || "").trim(),
			advancedFeePayment: (req.body.advancedFeePayment || "").trim(),
			createdBy: req.body.createdBy || {},
		};

		if (!payload.instituteId || !payload.fullName) {
			return res.status(400).json({ message: "instituteId and fullName are required" });
		}

		const institute = await findInstitute(payload.instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		payload.instituteName = institute.name || "";
		const student = await Student.create(payload);
		return res.status(201).json(student);
	} catch (error) {
		return res.status(500).json({ message: "Failed to create student", error: error.message });
	}
});

app.delete("/api/students/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const deletedStudent = await Student.findOneAndDelete({ _id: req.params.id, instituteId });
		if (!deletedStudent) {
			return res.status(404).json({ message: "Student not found" });
		}

		return res.status(200).json({ message: "Student deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete student", error: error.message });
	}
});

app.get("/api/teachers", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const teachers = await Teacher.find({ instituteId }).sort({ createdAt: -1 });
		return res.status(200).json(teachers);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch teachers", error: error.message });
	}
});

app.get("/api/teachers/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const teacher = await Teacher.findOne({ _id: req.params.id, instituteId });
		if (!teacher) {
			return res.status(404).json({ message: "Teacher not found" });
		}

		return res.status(200).json(teacher);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch teacher", error: error.message });
	}
});

app.post("/api/teachers", async (req, res) => {
	try {
		const adminId = (req.body.adminId || "").trim();
		const instituteId = (req.body.instituteId || "").trim();
		const ownerInstituteId = adminId || instituteId;

		if (adminId && instituteId && adminId !== instituteId) {
			return res.status(400).json({ message: "adminId and instituteId must match" });
		}

		const payload = {
			instituteId: ownerInstituteId,
			instituteName: "",
			fullName: (req.body.fullName || "").trim(),
			experience: (req.body.experience || "").trim(),
			qualification: (req.body.qualification || "").trim(),
			teacherId: ((req.body.teacherId || req.body.fullName) || "").trim(),
			teacherPassword: (req.body.teacherPassword || "").trim(),
			departmentName: (req.body.departmentName || "").trim(),
			createdBy: req.body.createdBy || {},
		};

		if (!payload.instituteId || !payload.fullName || !payload.teacherPassword) {
			return res.status(400).json({ message: "adminId/instituteId, fullName and teacherPassword are required" });
		}

		const institute = await findInstitute(payload.instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		payload.instituteName = institute.name || "";
		const teacher = await Teacher.create(payload);
		return res.status(201).json(teacher);
	} catch (error) {
		return res.status(500).json({ message: "Failed to create teacher", error: error.message });
	}
});

app.post("/api/teachers/login", async (req, res) => {
	try {
		const teacherId = (req.body.teacherId || "").trim();
		const teacherPassword = (req.body.teacherPassword || "").trim();

		if (!teacherId || !teacherPassword) {
			return res.status(400).json({ message: "teacherId and teacherPassword are required" });
		}

		const teacher = await Teacher.findOne({ teacherId, teacherPassword }).sort({ createdAt: -1 });
		if (!teacher) {
			return res.status(401).json({ message: "Invalid teacher ID or password" });
		}

		return res.status(200).json({
			message: "Teacher login successful",
			teacher,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to login teacher", error: error.message });
	}
});

app.delete("/api/teachers/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const deletedTeacher = await Teacher.findOneAndDelete({ _id: req.params.id, instituteId });
		if (!deletedTeacher) {
			return res.status(404).json({ message: "Teacher not found" });
		}

		return res.status(200).json({ message: "Teacher deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete teacher", error: error.message });
	}
});

const normalizeBatchPayload = (body = {}) => {
	const capacity = Number.parseInt(body.capacity, 10);
	const startDate = body.startDate ? new Date(body.startDate) : undefined;
	const allocatedTeachers = Array.isArray(body.allocatedTeachers)
		? body.allocatedTeachers
			.map((teacher, index) => ({
				id: (teacher?.id || teacher?.teacherId || teacher?._id || "").trim() || `teacher-${index}`,
				name: (teacher?.name || teacher?.fullName || teacher?.label || "").trim(),
				subject: (teacher?.subject || teacher?.departmentName || teacher?.qualification || "").trim(),
				exp: (teacher?.exp || teacher?.experience || "").trim(),
				avatar: (teacher?.avatar || "").trim(),
			}))
			.filter((teacher) => teacher.id || teacher.name)
		: [];
	const faculty = body.faculty || allocatedTeachers[0] || {};

	return {
		instituteId: (body.instituteId || "").trim(),
		instituteName: (body.instituteName || "").trim(),
		name: (body.name || "").trim(),
		description: (body.description || "").trim(),
		type: ((body.type || "Regular").trim()) || "Regular",
		capacity,
		startDate,
		students: Array.isArray(body.students) ? body.students : [],
		allocatedTeachers,
		faculty,
		createdBy: body.createdBy || {},
	};
};

app.get("/api/batches", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const batches = await Batch.find({ instituteId }).sort({ createdAt: -1 });
		return res.status(200).json(batches);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch batches", error: error.message });
	}
});

app.get("/api/batches/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const batch = await Batch.findOne({ _id: req.params.id, instituteId });
		if (!batch) {
			return res.status(404).json({ message: "Batch not found" });
		}

		return res.status(200).json(batch);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch batch", error: error.message });
	}
});

app.post("/api/batches", async (req, res) => {
	try {
		const payload = normalizeBatchPayload(req.body);

		if (!payload.instituteId || !payload.name || !payload.capacity) {
			return res.status(400).json({ message: "instituteId, name and capacity are required" });
		}

		if (payload.capacity < 1) {
			return res.status(400).json({ message: "capacity must be at least 1" });
		}

		if (payload.startDate && Number.isNaN(payload.startDate.getTime())) {
			return res.status(400).json({ message: "startDate is invalid" });
		}

		const batch = await Batch.create(payload);
		return res.status(201).json(batch);
	} catch (error) {
		return res.status(500).json({ message: "Failed to create batch", error: error.message });
	}
});

app.put("/api/batches/:id", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const payload = normalizeBatchPayload({ ...req.body, instituteId });
		if (!payload.name || !payload.capacity) {
			return res.status(400).json({ message: "name and capacity are required" });
		}

		const update = {
			name: payload.name,
			description: payload.description,
			capacity: payload.capacity,
			type: payload.type,
			students: payload.students,
			allocatedTeachers: payload.allocatedTeachers,
			faculty: payload.faculty,
			createdBy: payload.createdBy,
		};

		if (payload.startDate && !Number.isNaN(payload.startDate.getTime())) {
			update.startDate = payload.startDate;
		}

		const batch = await Batch.findOneAndUpdate(
			{ _id: req.params.id, instituteId },
			update,
			{ new: true, runValidators: true }
		);

		if (!batch) {
			return res.status(404).json({ message: "Batch not found" });
		}

		return res.status(200).json(batch);
	} catch (error) {
		return res.status(500).json({ message: "Failed to update batch", error: error.message });
	}
});

app.delete("/api/batches/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const deletedBatch = await Batch.findOneAndDelete({ _id: req.params.id, instituteId });
		if (!deletedBatch) {
			return res.status(404).json({ message: "Batch not found" });
		}

		return res.status(200).json({ message: "Batch deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete batch", error: error.message });
	}
});

app.get("/", (req, res) => {
	res.send("Server is running");
});

const startServer = async () => {
	try {
		await mongoose.connect(MONGO_URI);
		await ensureCollections();
		console.log("MongoDB connected successfully");

		app.listen(PORT, '0.0.0.0', () => {
			console.log(`Server running on http://0.0.0.0:${PORT}`);
			console.log(`Access from your machine: http://10.83.123.173:${PORT}`);
		});
	} catch (error) {
		console.error("MongoDB connection failed:", error.message);
		process.exit(1);
	}
};

startServer();
