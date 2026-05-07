const express = require("express");
const Attendance = require("../Models/Attendance");
const Institute = require("../Models/Institute");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

const normalizeStudentsAttendance = (studentsArray) => {
	return Array.isArray(studentsArray)
		? studentsArray.map((student) => ({
			studentId: String(student?.studentId || "").trim(),
			studentName: String(student?.studentName || "").trim(),
			status: ["present", "absent", "leave"].includes(String(student?.status || "").toLowerCase())
				? String(student?.status || "").toLowerCase()
				: "absent",
		}))
		: [];
};

const calculateAttendanceCounts = (studentsAttendance) => {
	let presentCount = 0,
		absentCount = 0,
		leaveCount = 0;

	if (Array.isArray(studentsAttendance)) {
		studentsAttendance.forEach((record) => {
			if (record.status === "present") presentCount++;
			else if (record.status === "absent") absentCount++;
			else if (record.status === "leave") leaveCount++;
		});
	}

	return {
		totalStudents: studentsAttendance?.length || 0,
		presentCount,
		absentCount,
		leaveCount,
	};
};

const hasAttendanceRecord = async ({ instituteId, batchId, date }) => {
	if (!instituteId || !batchId || !date) {
		return false;
	}

	const existing = await Attendance.findOne({
		instituteId: instituteId.trim(),
		batchId: batchId.trim(),
		date: date.trim(),
	}).lean();

	return Boolean(existing);
};

// ✅ GET all attendance records with filters
router.get("/", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const date = (req.query.date || "").trim();
		const subjectName = (req.query.subjectName || "").trim();
		const batchId = (req.query.batchId || "").trim();
		const studentId = (req.query.studentId || "").trim();

		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const filter = { instituteId };
		if (date) filter.date = date;
		if (subjectName) filter.subjectName = { $regex: subjectName, $options: "i" };
		if (batchId) filter.batchId = batchId;

		let attendance = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });

		// Filter by studentId if provided - only show records where this student is enrolled
		if (studentId) {
			attendance = attendance.filter((record) => {
				if (Array.isArray(record.studentsAttendance)) {
					return record.studentsAttendance.some((sa) => sa.studentId === studentId);
				}
				return false;
			});
		}

		return res.status(200).json(attendance);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch attendance records", error: error.message });
	}
});

// ✅ GET single attendance record by ID
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const attendance = await Attendance.findById(id);

		if (!attendance) {
			return res.status(404).json({ message: "Attendance record not found" });
		}

		return res.status(200).json(attendance);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch attendance record", error: error.message });
	}
});

// ✅ POST create new attendance record
router.post("/", async (req, res) => {
	try {
		const {
			instituteId,
			instituteName,
			teacherId,
			teacherName,
			date,
			subjectName,
			batchId,
			batchName,
			studentsAttendance,
			notes,
		} = req.body;

		// ✅ Validation
		if (!instituteId || !instituteId.trim()) {
			return res.status(400).json({ message: "instituteId is required" });
		}
		if (!teacherId || !teacherId.trim()) {
			return res.status(400).json({ message: "teacherId is required" });
		}
		if (!date || !date.trim()) {
			return res.status(400).json({ message: "date is required" });
		}
		if (!subjectName || !subjectName.trim()) {
			return res.status(400).json({ message: "subjectName is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const normalizedStudents = normalizeStudentsAttendance(studentsAttendance);
		const counts = calculateAttendanceCounts(normalizedStudents);
		if (await hasAttendanceRecord({ instituteId, batchId, date })) {
			return res.status(409).json({ message: "Attendance for this batch on this date already exists" });
		}

		const newAttendance = new Attendance({
			instituteId: instituteId.trim(),
			instituteName: instituteName || institute.name,
			teacherId: teacherId.trim(),
			teacherName: teacherName || "",
			date: date.trim(),
			subjectName: subjectName.trim(),
			batchId: batchId ? batchId.trim() : "",
			batchName: batchName || "",
			studentsAttendance: normalizedStudents,
			totalStudents: counts.totalStudents,
			presentCount: counts.presentCount,
			absentCount: counts.absentCount,
			leaveCount: counts.leaveCount,
			notes: notes ? String(notes).trim() : "",
		});

		const savedAttendance = await newAttendance.save();
		return res.status(201).json({
			message: "Attendance record created successfully",
			attendance: savedAttendance,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to create attendance record", error: error.message });
	}
});

// ✅ PUT update attendance record
router.put("/:id", async (req, res) => {
	try {
		return res.status(403).json({ message: "Attendance records cannot be edited after submission" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to update attendance record", error: error.message });
	}
});

// ✅ DELETE attendance record
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const deletedAttendance = await Attendance.findByIdAndDelete(id);

		if (!deletedAttendance) {
			return res.status(404).json({ message: "Attendance record not found" });
		}

		return res.status(200).json({
			message: "Attendance record deleted successfully",
			attendance: deletedAttendance,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete attendance record", error: error.message });
	}
});

module.exports = router;
