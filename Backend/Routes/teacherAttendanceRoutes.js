const express = require("express");
const TeacherAttendance = require("../Models/TeacherAttendance");
const Institute = require("../Models/Institute");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

const normalizeTeachersAttendance = (records = []) => {
	return Array.isArray(records)
		? records.map((record) => ({
			teacherId: String(record?.teacherId || "").trim(),
			teacherName: String(record?.teacherName || "").trim(),
			role: String(record?.role || "").trim(),
			batch: String(record?.batch || "").trim(),
			subject: String(record?.subject || "").trim(),
			status: ["present", "absent", "late", "leave"].includes(String(record?.status || "").toLowerCase())
				? String(record?.status || "").toLowerCase()
				: "present",
			initials: String(record?.initials || "").trim(),
			color: String(record?.color || "#6B7280").trim(),
		}))
		: [];
};

const calculateCounts = (records = []) => {
	let presentCount = 0;
	let absentCount = 0;
	let lateCount = 0;
	let leaveCount = 0;

	for (const record of records) {
		if (record.status === "present") presentCount += 1;
		else if (record.status === "absent") absentCount += 1;
		else if (record.status === "late") lateCount += 1;
		else if (record.status === "leave") leaveCount += 1;
	}

	return {
		totalTeachers: records.length,
		presentCount,
		absentCount,
		lateCount,
		leaveCount,
	};
};

router.get("/", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const attendanceDate = (req.query.attendanceDate || "").trim();

		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const filter = { instituteId };
		if (attendanceDate) {
			filter.attendanceDate = attendanceDate;
		}

		const records = await TeacherAttendance.find(filter).sort({ attendanceDate: -1, createdAt: -1 });
		return res.status(200).json(records);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch teacher attendance", error: error.message });
	}
});

router.post("/", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		const attendanceDate = (req.body.attendanceDate || "").trim();

		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}
		if (!attendanceDate) {
			return res.status(400).json({ message: "attendanceDate is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const teachersAttendance = normalizeTeachersAttendance(req.body.teachersAttendance);
		const counts = calculateCounts(teachersAttendance);

		const payload = {
			instituteId,
			instituteName: (req.body.instituteName || institute.name || "").trim(),
			attendanceDate,
			teachersAttendance,
			totalTeachers: counts.totalTeachers,
			presentCount: counts.presentCount,
			absentCount: counts.absentCount,
			lateCount: counts.lateCount,
			leaveCount: counts.leaveCount,
			markedBy: req.body.markedBy || {},
		};

		const saved = await TeacherAttendance.findOneAndUpdate(
			{ instituteId, attendanceDate },
			payload,
			{ new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
		);

		return res.status(200).json(saved);
	} catch (error) {
		return res.status(500).json({ message: "Failed to save teacher attendance", error: error.message });
	}
});

module.exports = router;