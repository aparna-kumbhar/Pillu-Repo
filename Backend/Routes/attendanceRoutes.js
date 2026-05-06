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

// ✅ GET all attendance records with filters
router.get("/", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const date = (req.query.date || "").trim();
		const subjectName = (req.query.subjectName || "").trim();
		const batchId = (req.query.batchId || "").trim();

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

		const attendance = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });
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
		const { id } = req.params;
		const {
			teacherId,
			teacherName,
			date,
			subjectName,
			batchId,
			batchName,
			studentsAttendance,
			notes,
		} = req.body;

		const attendance = await Attendance.findById(id);
		if (!attendance) {
			return res.status(404).json({ message: "Attendance record not found" });
		}

		// ✅ Update fields if provided
		if (teacherId) attendance.teacherId = teacherId.trim();
		if (teacherName) attendance.teacherName = teacherName;
		if (date) attendance.date = date.trim();
		if (subjectName) attendance.subjectName = subjectName.trim();
		if (batchId !== undefined) attendance.batchId = batchId ? batchId.trim() : "";
		if (batchName) attendance.batchName = batchName;
		if (studentsAttendance) {
			const normalizedStudents = normalizeStudentsAttendance(studentsAttendance);
			attendance.studentsAttendance = normalizedStudents;

			const counts = calculateAttendanceCounts(normalizedStudents);
			attendance.totalStudents = counts.totalStudents;
			attendance.presentCount = counts.presentCount;
			attendance.absentCount = counts.absentCount;
			attendance.leaveCount = counts.leaveCount;
		}
		if (notes !== undefined) attendance.notes = notes ? String(notes).trim() : "";

		const updatedAttendance = await attendance.save();
		return res.status(200).json({
			message: "Attendance record updated successfully",
			attendance: updatedAttendance,
		});
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
