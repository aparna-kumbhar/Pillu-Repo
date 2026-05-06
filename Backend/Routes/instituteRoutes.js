const express = require("express");
const Institute = require("../Models/Institute");

const router = express.Router();

router.get("/", async (req, res) => {
	try {
		const institutes = await Institute.find().sort({ createdAt: -1 });
		res.status(200).json(institutes);
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch institutes", error: error.message });
	}
});

router.get("/:id", async (req, res) => {
	try {
		const institute = await Institute.findById(req.params.id);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}
		res.status(200).json(institute);
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch institute", error: error.message });
	}
});

router.post("/admin-login", async (req, res) => {
	try {
		const instituteId = (req.body?.adminId || req.body?.instituteId || "").trim();
		const institutePassword = (req.body?.adminPassword || req.body?.institutePassword || "").trim();

		if (!instituteId || !institutePassword) {
			return res.status(400).json({
				message: "adminId/adminPassword (or instituteId/institutePassword) are required",
			});
		}

		const institute = await Institute.findOne({ instituteId });
		if (!institute || institute.institutePassword !== institutePassword) {
			return res.status(401).json({ message: "Invalid admin ID or password" });
		}

		return res.status(200).json({
			message: "Admin login successful",
			institute: {
				id: institute._id,
				name: institute.name,
				adminId: institute.instituteId,
				instituteId: institute.instituteId,
				adminName: institute.adminName,
				email: institute.email,
				modules: institute.modules,
			},
		});
	} catch (error) {
		return res.status(500).json({ message: "Admin login failed", error: error.message });
	}
});

router.post("/register", async (req, res) => {
	try {
		const {
			name,
			location,
			instituteId,
			institutePassword,
			joinDate,
			adminName,
			email,
			phone,
			modules,
		} = req.body;

		const trimmedName = (name || "").trim();
		const trimmedLocation = (location || "").trim();
		const trimmedInstituteId = (instituteId || "").trim();
		const trimmedPassword = (institutePassword || "").trim();

		if (!trimmedName || !trimmedLocation || !trimmedInstituteId || !trimmedPassword) {
			return res.status(400).json({
				message: "name, location, instituteId and institutePassword are required",
			});
		}

		if (trimmedPassword.length < 6) {
			return res.status(400).json({
				message: "institutePassword must be at least 6 characters",
			});
		}

		let parsedJoinDate;
		if (joinDate) {
			const dateCandidate = new Date(joinDate);
			if (Number.isNaN(dateCandidate.getTime())) {
				return res.status(400).json({
					message: "joinDate is invalid. Use ISO format like 2026-04-19",
				});
			}
			parsedJoinDate = dateCandidate;
		}

		const existingInstitute = await Institute.findOne({ instituteId: trimmedInstituteId });
		if (existingInstitute) {
			return res.status(409).json({ message: "Institute ID already exists" });
		}

		const newInstitute = await Institute.create({
			name: trimmedName,
			location: trimmedLocation,
			instituteId: trimmedInstituteId,
			institutePassword: trimmedPassword,
			joinDate: parsedJoinDate,
			adminName,
			email,
			phone,
			modules,
		});

		res.status(201).json(newInstitute);
	} catch (error) {
		if (error?.code === 11000) {
			return res.status(409).json({ message: "Institute ID already exists" });
		}

		if (error?.name === "ValidationError") {
			const messages = Object.values(error.errors || {})
				.map((item) => item.message)
				.filter(Boolean);
			return res.status(400).json({
				message: messages[0] || "Validation failed",
				error: error.message,
			});
		}

		res.status(500).json({ message: "Failed to register institute", error: error.message });
	}
});

module.exports = router;
