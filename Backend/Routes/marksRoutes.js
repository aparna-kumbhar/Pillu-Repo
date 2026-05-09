const express = require("express");
const ExamMarks = require("../Models/ExamMarks");
const Institute = require("../Models/Institute");
const Batch = require("../Models/Batch");
const Student = require("../Models/Student");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

// ── GET: Fetch all marks for an institute ──
router.get("/", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const batchId = (req.query.batchId || "").trim();
		const examName = (req.query.examName || "").trim();
		const published = req.query.published;

		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const filter = { instituteId };
		if (batchId) filter.batchId = batchId;
		if (examName) filter.examName = examName;
		if (published !== undefined) filter.published = published === "true";

		const marks = await ExamMarks.find(filter).sort({ createdAt: -1 });
		return res.status(200).json(marks);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch marks", error: error.message });
	}
});

// ── GET: Fetch marks for a specific student ──
router.get("/student/:studentId", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const studentId = req.params.studentId.trim();

		if (!instituteId || !studentId) {
			return res.status(400).json({ message: "instituteId and studentId are required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const marks = await ExamMarks.find({ instituteId, studentId }).sort({ examName: 1 });
		return res.status(200).json(marks);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch student marks", error: error.message });
	}
});

// ── GET: Fetch unique batches with marks count ──
router.get("/batches/list", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		// Get unique batches from marks collection
		const batches = await ExamMarks.aggregate([
			{ $match: { instituteId } },
			{
				$group: {
					_id: "$batchId",
					batchName: { $first: "$batchName" },
					marksCount: { $sum: 1 },
					examsCount: { $addToSet: "$examName" },
					published: { $max: "$published" },
				},
			},
			{
				$project: {
					_id: 0,
					batchId: "$_id",
					batchName: 1,
					marksCount: 1,
					examsCount: { $size: "$examsCount" },
					published: 1,
				},
			},
			{ $sort: { batchName: 1 } },
		]);

		return res.status(200).json(batches);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch batches", error: error.message });
	}
});

// ── GET: Fetch marks for a specific batch ──
router.get("/batch/:batchId", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const batchId = req.params.batchId.trim();
		const examName = (req.query.examName || "").trim();

		if (!instituteId || !batchId) {
			return res.status(400).json({ message: "instituteId and batchId are required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const filter = { instituteId, batchId };
		if (examName) filter.examName = examName;

		const marks = await ExamMarks.find(filter)
			.sort({ examName: -1, studentName: 1 })
			.lean();

		return res.status(200).json(marks);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch batch marks", error: error.message });
	}
});

// ── GET: Fetch marks for a specific exam ──
router.get("/exam/:examName", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const examName = req.params.examName.trim();

		if (!instituteId || !examName) {
			return res.status(400).json({ message: "instituteId and examName are required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const marks = await ExamMarks.find({ instituteId, examName }).sort({ batchName: 1, studentName: 1 });
		return res.status(200).json(marks);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch exam marks", error: error.message });
	}
});

// ── POST: Save marks (single or bulk) ──
router.post("/save", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		const batchId = (req.body.batchId || "").trim();
		const instituteName = (req.body.instituteName || "").trim();
		const batchName = (req.body.batchName || "").trim();
		const marksArray = Array.isArray(req.body.marksArray) ? req.body.marksArray : [];
		const createdBy = req.body.createdBy || {};

		if (!instituteId || !batchId || marksArray.length === 0) {
			return res.status(400).json({
				message: "instituteId, batchId, and marksArray are required",
			});
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const savedMarks = [];
		const errors = [];

		for (const markData of marksArray) {
			try {
				const {
					examName,
					subject,
					subjectCode,
					studentId,
					studentName,
					studentRoll,
					marks,
					totalMarks,
					remarks,
				} = markData;

				if (!examName || !subject || !studentId || !studentName || marks === undefined) {
					errors.push(`Invalid mark data for student ${studentName}: Missing required fields`);
					continue;
				}

				const filter = { instituteId, batchId, examName, studentId };

				const computedTotalMarks = Number(totalMarks) || 100;
				const computedPercentage = computedTotalMarks > 0
					? Number(((Number(marks) / computedTotalMarks) * 100).toFixed(2))
					: 0;

				const markRecord = await ExamMarks.findOneAndUpdate(
					filter,
					{
						$set: {
							instituteId,
							instituteName,
							batchId,
							batchName,
							examName: String(examName).trim(),
							subject: String(subject).trim(),
							subjectCode: String(subjectCode || "").trim(),
							studentId: String(studentId).trim(),
							studentName: String(studentName).trim(),
							studentRoll: String(studentRoll || "").trim(),
							marks: Number(marks),
							totalMarks: computedTotalMarks,
							percentage: computedPercentage,
							updatedBy: createdBy,
						},
					},
					{ upsert: true, new: true, runValidators: true }
				);

				savedMarks.push(markRecord);
			} catch (error) {
				errors.push(`Error saving marks for ${markData.studentName}: ${error.message}`);
			}
		}

		return res.status(201).json({
			message: "Marks saved successfully",
			savedCount: savedMarks.length,
			savedMarks,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to save marks", error: error.message });
	}
});

// ── PUT: Update a specific mark record ──
router.put("/:id", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		const { marks, totalMarks, remarks, grade } = req.body;
		const markId = req.params.id.trim();

		if (!instituteId || marks === undefined) {
			return res.status(400).json({ message: "instituteId and marks are required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const markRecord = await ExamMarks.findOne({ _id: markId, instituteId });
		if (!markRecord) {
			return res.status(404).json({ message: "Mark record not found" });
		}

		markRecord.marks = Number(marks);
		if (totalMarks) markRecord.totalMarks = Number(totalMarks);
		if (remarks) markRecord.remarks = String(remarks).trim();
		if (grade) markRecord.grade = String(grade).trim();

		await markRecord.save();

		return res.status(200).json({ message: "Mark updated successfully", mark: markRecord });
	} catch (error) {
		return res.status(500).json({ message: "Failed to update mark", error: error.message });
	}
});

// ── DELETE: Delete a specific mark record ──
router.delete("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const markId = req.params.id.trim();

		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const result = await ExamMarks.findOneAndDelete({ _id: markId, instituteId });
		if (!result) {
			return res.status(404).json({ message: "Mark record not found" });
		}

		return res.status(200).json({ message: "Mark deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete mark", error: error.message });
	}
});

// ── POST: Publish/unpublish marks ──
router.post("/publish/batch", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		const batchId = (req.body.batchId || "").trim();
		const examName = (req.body.examName || "").trim();
		const published = req.body.published !== false;

		if (!instituteId || !batchId) {
			return res.status(400).json({ message: "instituteId and batchId are required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const filter = { instituteId, batchId };
		if (examName) filter.examName = examName;

		const result = await ExamMarks.updateMany(filter, { $set: { published } });

		return res.status(200).json({
			message: `Marks ${published ? "published" : "unpublished"} successfully`,
			modifiedCount: result.modifiedCount,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to publish marks", error: error.message });
	}
});

module.exports = router;
