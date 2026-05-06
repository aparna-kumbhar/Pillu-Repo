const express = require("express");
const Assistant = require("../Models/Assistant");
const Institute = require("../Models/Institute");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

// ─── GET all assistants for an institute ────────────────────────────────────
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

		const assistants = await Assistant.find({ instituteId }).sort({ createdAt: -1 });
		return res.status(200).json(assistants);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch assistants", error: error.message });
	}
});

// ─── GET a specific assistant by ID ──────────────────────────────────────────
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

		const assistant = await Assistant.findOne({ _id: req.params.id, instituteId });
		if (!assistant) {
			return res.status(404).json({ message: "Assistant not found" });
		}

		return res.status(200).json(assistant);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch assistant", error: error.message });
	}
});

// ─── CREATE a new assistant (admin only) ─────────────────────────────────────
router.post("/", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		const assistantName = (req.body.assistantName || "").trim();
		const password = (req.body.password || "").trim();

		// Validate required fields
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}
		if (!assistantName) {
			return res.status(400).json({ message: "assistantName is required" });
		}
		if (!password) {
			return res.status(400).json({ message: "password is required" });
		}

		// Verify institute exists
		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		// Check if assistant with same name already exists for this institute
		const existingAssistant = await Assistant.findOne({ instituteId, assistantName });
		if (existingAssistant) {
			return res.status(409).json({ message: "An assistant with this name already exists in your institute" });
		}

		// Create new assistant
		const payload = {
			instituteId,
			instituteName: institute.name || "",
			assistantName,
			qualification: (req.body.qualification || "").trim(),
			dateOfBirth: (req.body.dateOfBirth || "").trim(),
			password, // Store plain password (or hash in production)
			phoneNumber: (req.body.phoneNumber || "").trim(),
			yearOfExperience: (req.body.yearOfExperience || "").trim(),
			department: (req.body.department || "").trim(),
			address: (req.body.address || "").trim(),
			email: (req.body.email || "").trim().toLowerCase(),
			notes: (req.body.notes || "").trim(),
			createdBy: req.body.createdBy || {},
		};

		const newAssistant = new Assistant(payload);
		const savedAssistant = await newAssistant.save();

		return res.status(201).json({
			message: "Assistant created successfully",
			assistant: savedAssistant,
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "An assistant with this name already exists for this institute" });
		}
		return res.status(500).json({ message: "Failed to create assistant", error: error.message });
	}
});

// ─── ASSISTANT LOGIN (assistantName + password) ──────────────────────────────
router.post("/login", async (req, res) => {
	try {
		const assistantName = (req.body.assistantName || req.body.username || "").trim();
		const password = (req.body.password || "").trim();

		if (!assistantName || !password) {
			return res.status(400).json({ message: "assistantName and password are required" });
		}

		// Search for assistant by name and password (case-insensitive)
		const escapedName = assistantName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const assistant = await Assistant.findOne({
			assistantName: { $regex: `^${escapedName}$`, $options: "i" },
			password,
		});

		if (!assistant) {
			return res.status(401).json({ message: "Invalid assistantName or password" });
		}

		return res.status(200).json({
			message: "Assistant login successful",
			assistant,
			instituteId: assistant.instituteId,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to login assistant", error: error.message });
	}
});

// ─── UPDATE an assistant ─────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
	try {
		const assistantId = (req.params.id || "").trim();
		const instituteId = (req.body.instituteId || "").trim();

		if (!assistantId) {
			return res.status(400).json({ message: "assistant id is required" });
		}
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		// Verify institute exists
		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		// Find and update assistant
		const updatedAssistant = await Assistant.findOneAndUpdate(
			{ _id: assistantId, instituteId },
			{
				...(req.body.assistantName && { assistantName: req.body.assistantName.trim() }),
				...(req.body.qualification && { qualification: req.body.qualification.trim() }),
				...(req.body.dateOfBirth && { dateOfBirth: req.body.dateOfBirth.trim() }),
				...(req.body.password && { password: req.body.password.trim() }),
				...(req.body.phoneNumber && { phoneNumber: req.body.phoneNumber.trim() }),
				...(req.body.yearOfExperience && { yearOfExperience: req.body.yearOfExperience.trim() }),
				...(req.body.department && { department: req.body.department.trim() }),
				...(req.body.address && { address: req.body.address.trim() }),
				...(req.body.email && { email: req.body.email.trim().toLowerCase() }),
				...(req.body.notes && { notes: req.body.notes.trim() }),
				updatedAt: new Date(),
			},
			{ new: true, runValidators: true }
		);

		if (!updatedAssistant) {
			return res.status(404).json({ message: "Assistant not found" });
		}

		return res.status(200).json({
			message: "Assistant updated successfully",
			assistant: updatedAssistant,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to update assistant", error: error.message });
	}
});

// ─── DELETE an assistant ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
	try {
		const assistantId = (req.params.id || "").trim();
		const instituteId = (req.query.instituteId || "").trim();

		if (!assistantId) {
			return res.status(400).json({ message: "assistant id is required" });
		}
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		// Verify institute exists
		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const deletedAssistant = await Assistant.findOneAndDelete(
			{ _id: assistantId, instituteId },
			{ new: true }
		);

		if (!deletedAssistant) {
			return res.status(404).json({ message: "Assistant not found" });
		}

		return res.status(200).json({
			message: "Assistant deleted successfully",
			assistant: deletedAssistant,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete assistant", error: error.message });
	}
});

module.exports = router;
