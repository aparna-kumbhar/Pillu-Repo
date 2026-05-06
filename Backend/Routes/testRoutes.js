const express = require("express");
const Test = require("../Models/Test");
const Institute = require("../Models/Institute");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

const normalizeQuestionOptions = (options) => {
	return Array.isArray(options)
		? options.map((option) => ({
			id: String(option?.id || "").trim(),
			text: String(option?.text || "").trim(),
			isCorrect: Boolean(option?.isCorrect),
		}))
		: [];
};

const normalizeQuestionsArray = (questionsArray) => {
	return Array.isArray(questionsArray)
		? questionsArray.map((question) => ({
			id: String(question?.id || "").trim(),
			questionType: String(question?.questionType || "Multiple Choice").trim() || "Multiple Choice",
			points: Number(question?.points || 0),
			prompt: String(question?.prompt || "").trim(),
			options: normalizeQuestionOptions(question?.options),
		}))
		: [];
};

router.get("/", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const tests = await Test.find({ instituteId }).sort({ createdAt: -1 });
		return res.status(200).json(tests);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch tests", error: error.message });
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

		const test = await Test.findOne({ _id: req.params.id, instituteId });
		if (!test) {
			return res.status(404).json({ message: "Test not found" });
		}

		return res.status(200).json(test);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch test", error: error.message });
	}
});

router.post("/", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		const title = (req.body.title || "").trim();

		if (!instituteId || !title) {
			return res.status(400).json({ message: "instituteId and title are required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const payload = {
			instituteId,
			instituteName: institute.name || "",
			title,
			questionType: (req.body.questionType || "Multiple Choice").trim() || "Multiple Choice",
			points: Number(req.body.points || 0),
			prompt: (req.body.prompt || "").trim(),
			questions: Number(req.body.questions || 0),
			questionsArray: normalizeQuestionsArray(req.body.questionsArray),
			status: (req.body.status || "DRAFT").trim() || "DRAFT",
			date: (req.body.date || "").trim(),
			author: (req.body.author || "").trim(),
			emoji: (req.body.emoji || "❓").trim() || "❓",
			createdBy: req.body.createdBy || {},
		};

		const test = await Test.create(payload);
		return res.status(201).json(test);
	} catch (error) {
		return res.status(500).json({ message: "Failed to create test", error: error.message });
	}
});

router.put("/:id", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const update = {
			title: (req.body.title || "").trim(),
			questionType: (req.body.questionType || "Multiple Choice").trim() || "Multiple Choice",
			points: Number(req.body.points || 0),
			prompt: (req.body.prompt || "").trim(),
			questions: Number(req.body.questions || 0),
			questionsArray: normalizeQuestionsArray(req.body.questionsArray),
			status: (req.body.status || "DRAFT").trim() || "DRAFT",
			date: (req.body.date || "").trim(),
			author: (req.body.author || "").trim(),
			emoji: (req.body.emoji || "❓").trim() || "❓",
			createdBy: req.body.createdBy || {},
		};

		if (!update.title) {
			return res.status(400).json({ message: "title is required" });
		}

		const test = await Test.findOneAndUpdate(
			{ _id: req.params.id, instituteId },
			{ $set: { ...update, instituteName: institute.name || "" } },
			{ new: true, runValidators: true }
		);

		if (!test) {
			return res.status(404).json({ message: "Test not found" });
		}

		return res.status(200).json(test);
	} catch (error) {
		return res.status(500).json({ message: "Failed to update test", error: error.message });
	}
});

router.delete("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const deletedTest = await Test.findOneAndDelete({ _id: req.params.id, instituteId });
		if (!deletedTest) {
			return res.status(404).json({ message: "Test not found" });
		}

		return res.status(200).json({ message: "Test deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete test", error: error.message });
	}
});

module.exports = router;
