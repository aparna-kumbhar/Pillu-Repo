const express = require("express");
const Schedule = require("../Models/Schedule");
const Batch = require("../Models/Batch");
const Institute = require("../Models/Institute");

const router = express.Router();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const normalizeSession = (s = {}) => ({
	day: (s.day || "").trim(),
	startTime: (s.startTime || "").trim(),
	endTime: (s.endTime || "").trim(),
	subject: {
		id: (s.subject?.id || "").trim(),
		label: (s.subject?.label || "").trim(),
	},
	classroom: {
		id: (s.classroom?.id || "").trim(),
		label: (s.classroom?.label || "").trim(),
	},
	faculty: {
		id: (s.faculty?.id || "").trim(),
		label: (s.faculty?.label || "").trim(),
	},
	color: s.color || "green",
});

const normalizeSchedulePayload = (body = {}) => ({
	instituteId: (body.instituteId || "").trim(),
	instituteName: (body.instituteName || "").trim(),
	batch: {
		id: (body.batch?.id || "").trim(),
		label: (body.batch?.label || body.batch?.name || "").trim(),
	},
	weekLabel: (body.weekLabel || "").trim(),
	sessions: Array.isArray(body.sessions) ? body.sessions.map(normalizeSession) : [],
	createdBy: {
		adminName: (body.createdBy?.adminName || "").trim(),
		email: (body.createdBy?.email || "").trim().toLowerCase(),
	},
});

const mergeSessions = (existingSessions = [], incomingSessions = []) => {
	let merged = [...existingSessions];

	for (const session of incomingSessions) {
		merged = merged.filter((item) => !(item.day === session.day && item.startTime === session.startTime));
		merged.push(session);
	}

	return merged;
};

const resolveInstituteContext = async (instituteId) => {
	return Institute.findOne({ instituteId }).lean();
};

const resolveBatchForInstitute = async (instituteId, batchId) => {
	return Batch.findOne({ _id: batchId, instituteId }).lean();
};

const validateSession = (s) => {
	if (!s.day) return "session.day is required";
	if (!s.startTime) return "session.startTime is required";
	if (!s.endTime) return "session.endTime is required";
	if (!s.subject?.id) return "session.subject.id is required";
	if (!s.classroom?.id) return "session.classroom.id is required";
	if (!s.faculty?.id) return "session.faculty.id is required";
	return null;
};

// ─── GET ALL SCHEDULES FOR AN INSTITUTE ──────────────────────────────────────
// GET /api/schedules?instituteId=xxx
router.get("/", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const schedules = await Schedule.find({ instituteId }).sort({ createdAt: -1 });
		return res.status(200).json(schedules);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch schedules", error: error.message });
	}
});

// ─── GET SCHEDULES FOR A SPECIFIC BATCH ──────────────────────────────────────
// GET /api/schedules/batch/:batchId?instituteId=xxx
router.get("/batch/:batchId", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const schedules = await Schedule.find({
			instituteId,
			"batch.id": req.params.batchId,
		}).sort({ createdAt: -1 });

		return res.status(200).json(schedules);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch schedules for batch", error: error.message });
	}
});

// ─── GET SINGLE SCHEDULE ─────────────────────────────────────────────────────
// GET /api/schedules/:id?instituteId=xxx
router.get("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const schedule = await Schedule.findOne({ _id: req.params.id, instituteId });
		if (!schedule) {
			return res.status(404).json({ message: "Schedule not found" });
		}

		return res.status(200).json(schedule);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch schedule", error: error.message });
	}
});

// ─── CREATE SCHEDULE ─────────────────────────────────────────────────────────
// POST /api/schedules
// Body: { instituteId, instituteName, batch: { id, label }, weekLabel, sessions: [...], createdBy }
router.post("/", async (req, res) => {
	try {
		const payload = normalizeSchedulePayload(req.body);

		if (!payload.instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}
		if (!payload.batch?.id) {
			return res.status(400).json({ message: "batch.id is required" });
		}
		if (!payload.sessions.length) {
			return res.status(400).json({ message: "At least one session is required" });
		}

		const institute = await resolveInstituteContext(payload.instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const batch = await resolveBatchForInstitute(payload.instituteId, payload.batch.id);
		if (!batch) {
			return res.status(404).json({ message: "Batch not found for this institute" });
		}

		payload.instituteName = payload.instituteName || institute.name || "";
		payload.batch.label = payload.batch.label || batch.name || "";

		for (const session of payload.sessions) {
			const err = validateSession(session);
			if (err) return res.status(400).json({ message: err });
		}

		const existingSchedule = await Schedule.findOne({
			instituteId: payload.instituteId,
			"batch.id": payload.batch.id,
		});

		if (existingSchedule) {
			existingSchedule.instituteName = payload.instituteName;
			existingSchedule.batch = payload.batch;
			existingSchedule.weekLabel = payload.weekLabel;
			existingSchedule.createdBy = payload.createdBy;
			existingSchedule.sessions = mergeSessions(existingSchedule.sessions, payload.sessions);
			await existingSchedule.save();
			return res.status(200).json(existingSchedule);
		}

		const schedule = await Schedule.create(payload);
		return res.status(201).json(schedule);
	} catch (error) {
		return res.status(500).json({ message: "Failed to create schedule", error: error.message });
	}
});

// ─── ADD A SINGLE SESSION TO EXISTING SCHEDULE ───────────────────────────────
// POST /api/schedules/:id/sessions
// Body: { instituteId, session: { day, startTime, endTime, subject, classroom, faculty, color } }
router.post("/:id/sessions", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const session = normalizeSession(req.body.session || {});
		const err = validateSession(session);
		if (err) return res.status(400).json({ message: err });

		// Remove any existing session for same day + startTime (replace logic)
		const schedule = await Schedule.findOne({ _id: req.params.id, instituteId });
		if (!schedule) {
			return res.status(404).json({ message: "Schedule not found" });
		}

		schedule.sessions = schedule.sessions.filter(
			(s) => !(s.day === session.day && s.startTime === session.startTime)
		);
		schedule.sessions.push(session);
		await schedule.save();

		return res.status(200).json(schedule);
	} catch (error) {
		return res.status(500).json({ message: "Failed to add session", error: error.message });
	}
});

// ─── UPDATE ENTIRE SCHEDULE ───────────────────────────────────────────────────
// PUT /api/schedules/:id
router.put("/:id", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const payload = normalizeSchedulePayload({ ...req.body, instituteId });

		if (!payload.batch?.id) {
			return res.status(400).json({ message: "batch.id is required" });
		}

		const institute = await resolveInstituteContext(payload.instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const batch = await resolveBatchForInstitute(payload.instituteId, payload.batch.id);
		if (!batch) {
			return res.status(404).json({ message: "Batch not found for this institute" });
		}

		payload.instituteName = payload.instituteName || institute.name || "";
		payload.batch.label = payload.batch.label || batch.name || "";

		for (const session of payload.sessions) {
			const err = validateSession(session);
			if (err) return res.status(400).json({ message: err });
		}

		const schedule = await Schedule.findOneAndUpdate(
			{ _id: req.params.id, instituteId },
			{
				instituteName: payload.instituteName,
				batch: payload.batch,
				weekLabel: payload.weekLabel,
				sessions: payload.sessions,
				createdBy: payload.createdBy,
			},
			{ new: true, runValidators: true }
		);

		if (!schedule) {
			return res.status(404).json({ message: "Schedule not found" });
		}

		return res.status(200).json(schedule);
	} catch (error) {
		return res.status(500).json({ message: "Failed to update schedule", error: error.message });
	}
});

// ─── DELETE A SINGLE SESSION FROM A SCHEDULE ─────────────────────────────────
// DELETE /api/schedules/:id/sessions/:sessionId?instituteId=xxx
router.delete("/:id/sessions/:sessionId", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const schedule = await Schedule.findOne({ _id: req.params.id, instituteId });
		if (!schedule) {
			return res.status(404).json({ message: "Schedule not found" });
		}

		if (req.params.sessionId) {
			const before = schedule.sessions.length;
			schedule.sessions = schedule.sessions.filter((s) => String(s._id) !== req.params.sessionId);

			if (schedule.sessions.length === before) {
				return res.status(404).json({ message: "Session not found in schedule" });
			}
		} else {
			const session = normalizeSession(req.body.session || {});
			const err = validateSession(session);
			if (err) return res.status(400).json({ message: err });

			schedule.sessions = mergeSessions(schedule.sessions, [session]);
		}

		await schedule.save();
		return res.status(200).json(schedule);
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete session", error: error.message });
	}
});

// ─── DELETE ENTIRE SCHEDULE ───────────────────────────────────────────────────
// DELETE /api/schedules/:id?instituteId=xxx
router.delete("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const deleted = await Schedule.findOneAndDelete({ _id: req.params.id, instituteId });
		if (!deleted) {
			return res.status(404).json({ message: "Schedule not found" });
		}

		return res.status(200).json({ message: "Schedule deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete schedule", error: error.message });
	}
});

module.exports = router;