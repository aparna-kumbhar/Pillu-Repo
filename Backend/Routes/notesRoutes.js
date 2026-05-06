const express = require("express");
const Note = require("../Models/Note");
const Institute = require("../Models/Institute");
const Teacher = require("../Models/Teacher");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

router.get("/", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const teacherId = (req.query.teacherId || "").trim();
		const subject = (req.query.subject || "").trim();
		const batch = (req.query.batch || "").trim();

		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const filter = { instituteId };
		if (teacherId) filter.teacherId = teacherId;
		if (subject) filter.subject = subject;
		if (batch) filter.batch = batch;

		const notes = await Note.find(filter).sort({ createdAt: -1 });
		return res.status(200).json(notes);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch notes", error: error.message });
	}
});

router.get("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const note = await Note.findOne({ _id: req.params.id, instituteId });
		if (!note) {
			return res.status(404).json({ message: "Note not found" });
		}

		return res.status(200).json(note);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch note", error: error.message });
	}
});

router.post("/", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		const teacherId = (req.body.teacherId || "").trim();
		const teacherName = (req.body.teacherName || "").trim();
		const title = (req.body.title || "").trim();
		const subject = (req.body.subject || "").trim();
		const batch = (req.body.batch || "OPEN ACCESS").trim() || "OPEN ACCESS";
		const fileName = (req.body.fileName || "").trim();
		const fileType = (req.body.fileType || "").trim();
		const mimeType = (req.body.mimeType || "").trim();
		const fileUri = (req.body.fileUri || "").trim();
		const fileSize = Number.isFinite(Number(req.body.fileSize)) ? Number(req.body.fileSize) : 0;

		if (!instituteId || !teacherId || !subject || !fileName) {
			return res.status(400).json({
				message: "instituteId, teacherId, subject and fileName are required",
			});
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const teacher = await Teacher.findOne({ teacherId, instituteId }).lean();
		if (!teacher) {
			return res.status(404).json({ message: "Teacher not found for this institute" });
		}

		const note = await Note.create({
			instituteId,
			instituteName: institute.name || "",
			teacherId,
			teacherName: teacherName || teacher.fullName || teacher.teacherId || "",
			title,
			subject,
			batch,
			fileName,
			fileType,
			mimeType,
			fileSize,
			fileUri,
			createdBy: req.body.createdBy || {},
		});

		return res.status(201).json(note);
	} catch (error) {
		return res.status(500).json({ message: "Failed to save note", error: error.message });
	}
});

router.delete("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const deleted = await Note.findOneAndDelete({ _id: req.params.id, instituteId });
		if (!deleted) {
			return res.status(404).json({ message: "Note not found" });
		}

		return res.status(200).json({ message: "Note deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete note", error: error.message });
	}
});

module.exports = router;
