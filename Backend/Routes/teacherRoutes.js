const express = require("express");
const Teacher = require("../Models/Teacher");
const Institute = require("../Models/Institute");
const Batch = require("../Models/Batch");
const Schedule = require("../Models/Schedule");
const Attendance = require("../Models/Attendance");
const ExamMarks = require("../Models/ExamMarks");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

const normalizeValue = (value) => String(value || "").trim();

const normalizeComparable = (value) => normalizeValue(value).toLowerCase();

const getDayKey = (value = "") => normalizeComparable(value).slice(0, 3);

const getLocalDateString = (date = new Date()) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const allocationMatchesTeacher = (allocation = {}, teacherRefs = []) => {
	const allocationId = normalizeComparable(allocation?.id || allocation?.teacherId || allocation?._id);
	const allocationName = normalizeComparable(allocation?.name || allocation?.fullName || allocation?.label);

	return teacherRefs.some((reference) => {
		const candidate = normalizeComparable(reference);
		return candidate && (candidate === allocationId || candidate === allocationName);
	});
};

const calculateAverageAttendance = (records = []) => {
	let presentTotal = 0;
	let studentTotal = 0;

	for (const record of records) {
		const totalStudents = Number(record?.totalStudents || 0);
		const presentCount = Number(record?.presentCount || 0);

		if (totalStudents <= 0) {
			continue;
		}

		studentTotal += totalStudents;
		presentTotal += presentCount;
	}

	if (studentTotal <= 0) {
		return 0;
	}

	return Number(((presentTotal / studentTotal) * 100).toFixed(1));
};

const calculateAveragePerformance = (marks = []) => {
	if (!Array.isArray(marks) || marks.length === 0) {
		return 0;
	}

	const totalPercentage = marks.reduce((sum, record) => {
		const totalMarks = Number(record?.totalMarks || 0);
		const percentage = Number.isFinite(Number(record?.percentage))
			? Number(record.percentage)
			: totalMarks > 0
				? (Number(record?.marks || 0) / totalMarks) * 100
				: 0;

		return sum + percentage;
	}, 0);

	return Number((totalPercentage / marks.length).toFixed(1));
};

router.get("/dashboard-summary", async (req, res) => {
	try {
		const instituteId = normalizeValue(req.query.instituteId);
		const teacherId = normalizeValue(req.query.teacherId);
		const teacherName = normalizeValue(req.query.teacherName);

		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		if (!teacherId && !teacherName) {
			return res.status(400).json({ message: "teacherId or teacherName is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		let teacher = null;
		if (teacherId) {
			teacher = await Teacher.findOne({ instituteId, teacherId }).lean();
		}
		if (!teacher && teacherName) {
			teacher = await Teacher.findOne({ instituteId, fullName: teacherName }).lean();
		}

		const teacherRefs = Array.from(
			new Set([teacherId, teacherName, teacher?.teacherId, teacher?.fullName].map(normalizeValue).filter(Boolean))
		);

		const batches = await Batch.find({ instituteId }).sort({ createdAt: -1 }).lean();
		const activeBatches = batches.filter((batch) => {
			const allocatedTeachers = Array.isArray(batch.allocatedTeachers) ? batch.allocatedTeachers : [];
			const faculty = batch.faculty || {};
			return (
				allocatedTeachers.some((allocation) => allocationMatchesTeacher(allocation, teacherRefs)) ||
				allocationMatchesTeacher(faculty, teacherRefs)
			);
		});

		const today = new Date();
		const todayDate = getLocalDateString(today);
		const todayDay = today.toLocaleDateString("en-US", { weekday: "short" });
		const todayDayKey = getDayKey(todayDay);
		const activeBatchIds = activeBatches.map((batch) => String(batch._id));

		const batchSummaries = await Promise.all(
			activeBatches.map(async (batch) => {
				const batchId = String(batch._id);
				const students = Array.isArray(batch.students) ? batch.students : [];
				const allocatedTeachers = Array.isArray(batch.allocatedTeachers) ? batch.allocatedTeachers : [];

				const attendanceFilter = { instituteId, batchId };
				if (teacherId) {
					attendanceFilter.teacherId = teacherId;
				} else if (teacherName) {
					attendanceFilter.teacherName = teacherName;
				}

				const [attendanceRecords, marksRecords, schedules] = await Promise.all([
					Attendance.find(attendanceFilter).lean(),
					ExamMarks.find({ instituteId, batchId }).lean(),
					Schedule.find({ instituteId, "batch.id": batchId }).lean(),
				]);

				const attendanceAverage = calculateAverageAttendance(attendanceRecords);
				const performanceAverage = calculateAveragePerformance(marksRecords);

				const todaysLectures = schedules.flatMap((schedule) => {
					return (Array.isArray(schedule.sessions) ? schedule.sessions : [])
						.filter((session) => {
							const sessionDay = getDayKey(session?.day || "");
							if (sessionDay !== todayDayKey) {
								return false;
							}

							if (!teacherRefs.length) {
								return true;
							}

							const facultyId = normalizeComparable(session?.faculty?.id);
							const facultyLabel = normalizeComparable(session?.faculty?.label);
							return teacherRefs.some((reference) => {
								const candidate = normalizeComparable(reference);
								return candidate && (candidate === facultyId || candidate === facultyLabel);
							});
						})
						.map((session) => ({
							id: `${schedule._id}-${session._id || session.startTime}-${batchId}`,
							batchId,
							batchName: batch.name,
							date: todayDate,
							day: session.day,
							startTime: session.startTime,
							endTime: session.endTime,
							subject: session?.subject?.label || "Lecture",
							classroom: session?.classroom?.label || "Classroom",
							facultyName: session?.faculty?.label || teacher?.fullName || teacherName || "Teacher",
							facultyId: session?.faculty?.id || teacher?.teacherId || teacherId || "",
							color: session?.color || "green",
						}));
				});

				return {
					id: batchId,
					name: batch.name,
					description: batch.description || "",
					studentCount: students.length,
					attendanceAverage,
					performanceAverage,
					allocatedTeachers,
					todaysLectures,
				};
			})
		);

		const totalStudents = batchSummaries.reduce((sum, batch) => sum + Number(batch.studentCount || 0), 0);
		const attendanceWeighted = batchSummaries.reduce(
			(sum, batch) => sum + Number(batch.attendanceAverage || 0) * Number(batch.studentCount || 0),
			0
		);
		const averageAttendance = totalStudents > 0 ? Number((attendanceWeighted / totalStudents).toFixed(1)) : 0;

		const todaysLectures = batchSummaries
			.flatMap((batch) => batch.todaysLectures)
			.sort((left, right) => String(left.startTime).localeCompare(String(right.startTime)));

		const batchPerformance = batchSummaries
			.map((batch, index) => ({
				id: batch.id,
				label: `${batch.name} · ${batch.studentCount} students`,
				value: Math.round(batch.performanceAverage),
				attendanceAverage: batch.attendanceAverage,
				color: ["#3ECFCF", "#8B5CF6", "#4CAF82", "#F5A623"][index % 4],
			}))
			.sort((left, right) => right.value - left.value);

		return res.status(200).json({
			teacher: teacher || { teacherId, fullName: teacherName },
			summary: {
				activeBatchesCount: activeBatchIds.length,
				totalStudents,
				averageAttendance,
				currentDate: todayDate,
				currentDay: todayDay,
			},
			activeBatches: batchSummaries,
			todaysLectures,
			batchPerformance,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch teacher dashboard summary", error: error.message });
	}
});

router.get("/", async (req, res) => {
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

		const instituteTeachers = await Teacher.find({ instituteId }).sort({ createdAt: -1 });
		if (instituteTeachers.length > 0 || (!createdByEmail && !createdByAdminName)) {
			return res.status(200).json(instituteTeachers);
		}

		const fallbackFilter = { instituteId };
		if (createdByEmail) {
			fallbackFilter["createdBy.email"] = createdByEmail;
		}
		if (createdByAdminName) {
			fallbackFilter["createdBy.adminName"] = createdByAdminName;
		}

		const fallbackTeachers = await Teacher.find(fallbackFilter).sort({ createdAt: -1 });
		return res.status(200).json(fallbackTeachers);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch teachers", error: error.message });
	}
});

router.get("/:id", async (req, res) => {
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

router.post("/", async (req, res) => {
	try {
		const payload = {
			instituteId: (req.body.instituteId || "").trim(),
			instituteName: "",
			fullName: (req.body.fullName || "").trim(),
			experience: (req.body.experience || "").trim(),
			qualification: (req.body.qualification || "").trim(),
			teacherId: (req.body.fullName || "").trim(),
			teacherPassword: (req.body.teacherPassword || "").trim(),
			departmentName: (req.body.departmentName || "").trim(),
			createdBy: req.body.createdBy || {},
		};

		if (!payload.instituteId || !payload.fullName || !payload.teacherPassword) {
			return res.status(400).json({ message: "instituteId, fullName and teacherPassword are required" });
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

router.post("/login", async (req, res) => {
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

router.delete("/:id", async (req, res) => {
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

module.exports = router;