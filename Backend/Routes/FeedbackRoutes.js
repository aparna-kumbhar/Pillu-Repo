const express = require("express");
const Feedback = require("../Models/Feedback");
const Institute = require("../Models/Institute");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

router.get("/", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const subject = (req.query.subject || "").trim();
		const studentId = (req.query.studentId || "").trim();

		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const filter = { instituteId };
		if (subject) filter.subject = subject;
		if (studentId) filter.studentId = studentId;

		const feedbackList = await Feedback.find(filter).sort({ createdAt: -1 });
		return res.status(200).json(feedbackList);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch feedback", error: error.message });
	}
});

router.get("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const feedback = await Feedback.findOne({ _id: req.params.id, instituteId });
		if (!feedback) {
			return res.status(404).json({ message: "Feedback not found" });
		}

		return res.status(200).json(feedback);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch feedback", error: error.message });
	}
});

router.post("/", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		const studentId = (req.body.studentId || "").trim();
		const studentName = (req.body.studentName || "").trim();
		const subject = (req.body.subject || "General").trim() || "General";
		const department = (req.body.department || "").trim();
		const feedbackText = (req.body.feedbackText || "").trim();
		const ratingNumber = Number(req.body.rating);
		const rating = Number.isFinite(ratingNumber)
			? Math.min(5, Math.max(1, ratingNumber))
			: 5;

		const tags = Array.isArray(req.body.tags)
			? req.body.tags
					.map((tag) => String(tag || "").trim())
					.filter(Boolean)
			: [];

		if (!instituteId || !feedbackText) {
			return res.status(400).json({ message: "instituteId and feedbackText are required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const feedback = await Feedback.create({
			instituteId,
			instituteName: institute.name || "",
			studentId,
			studentName,
			subject,
			department,
			rating,
			feedbackText,
			tags,
			createdBy: req.body.createdBy || {},
		});

		return res.status(201).json(feedback);
	} catch (error) {
		return res.status(500).json({ message: "Failed to save feedback", error: error.message });
	}
});

router.delete("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const deleted = await Feedback.findOneAndDelete({ _id: req.params.id, instituteId });
		if (!deleted) {
			return res.status(404).json({ message: "Feedback not found" });
		}

		return res.status(200).json({ message: "Feedback deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete feedback", error: error.message });
	}
});

module.exports = router;