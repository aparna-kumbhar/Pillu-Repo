const express = require("express");
const Batch = require("../Models/Batch");

const router = express.Router();

const normalizeSubjects = (value) => {
	if (Array.isArray(value)) {
		return value.map((subject) => String(subject || "").trim()).filter(Boolean);
	}

	if (typeof value === "string") {
		return value
			.split(",")
			.map((subject) => subject.trim())
			.filter(Boolean);
	}

	return [];
};

const normalizeAllocatedTeachers = (value) => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((teacher, index) => ({
			id: (teacher?.id || teacher?.teacherId || teacher?._id || "").trim() || `teacher-${index}`,
			name: (teacher?.name || teacher?.fullName || teacher?.label || "").trim(),
			subject: (teacher?.subject || teacher?.departmentName || teacher?.qualification || "").trim(),
			exp: (teacher?.exp || teacher?.experience || "").trim(),
			avatar: (teacher?.avatar || "").trim(),
		}))
		.filter((teacher) => teacher.id || teacher.name);
};

const normalizeBatchPayload = (body = {}) => {
	const instituteId = (body.instituteId || "").trim();
	const instituteName = (body.instituteName || "").trim();
	const name = (body.name || "").trim();
	const description = (body.description || "").trim();
	const type = (body.type || "Regular").trim() || "Regular";
	const capacity = Number.parseInt(body.capacity, 10);
	const startDate = body.startDate ? new Date(body.startDate) : undefined;
	const allocatedTeachers = normalizeAllocatedTeachers(body.allocatedTeachers);
	const faculty = body.faculty || allocatedTeachers[0] || {};
	const subjects = normalizeSubjects(body.subjects || body.subject);

	return {
		instituteId,
		instituteName,
		name,
		description,
		type,
		subjects,
		capacity,
		startDate,
		students: Array.isArray(body.students) ? body.students : [],
		allocatedTeachers,
		faculty,
		createdBy: body.createdBy || {},
	};
};

router.get("/", async (req, res) => {
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

router.get("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		let batch = null;
		try {
			batch = await Batch.findOne({ _id: req.params.id, instituteId });
		} catch (error) {
			// Ignore cast errors and fall back to name lookup below.
		}

		if (!batch) {
			batch = await Batch.findOne({ name: req.params.id, instituteId });
		}

		if (!batch) {
			return res.status(404).json({ message: "Batch not found" });
		}

		return res.status(200).json(batch);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch batch", error: error.message });
	}
});

router.post("/", async (req, res) => {
	try {
		const payload = normalizeBatchPayload(req.body);

		if (!payload.instituteId || !payload.name || !payload.capacity) {
			return res.status(400).json({
				message: "instituteId, name and capacity are required",
			});
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

router.put("/:id", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const payload = normalizeBatchPayload({ ...req.body, instituteId });
		if (!payload.name || !payload.capacity) {
			return res.status(400).json({ message: "name and capacity are required" });
		}

		const batch = await Batch.findOneAndUpdate(
			{ _id: req.params.id, instituteId },
			{
				name: payload.name,
				description: payload.description,
				capacity: payload.capacity,
				startDate: payload.startDate && !Number.isNaN(payload.startDate.getTime()) ? payload.startDate : undefined,
				type: payload.type,
				subjects: payload.subjects,
				students: payload.students,
				allocatedTeachers: payload.allocatedTeachers,
				faculty: payload.faculty,
				createdBy: payload.createdBy,
			},
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

router.delete("/:id", async (req, res) => {
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

module.exports = router;