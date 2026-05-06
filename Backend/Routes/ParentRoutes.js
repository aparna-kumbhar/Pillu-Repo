const express = require("express");
const Parent = require("../Models/Parent");
const Student = require("../Models/Student");
const Institute = require("../Models/Institute");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

const normalizeValue = (value) => (value || "").trim();

// ✅ GET all parents for an institute
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

		const parents = await Parent.find({ instituteId }).sort({ createdAt: -1 });
		return res.status(200).json(parents);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch parents", error: error.message });
	}
});

// ✅ GET single parent by ID
router.get("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const parent = await Parent.findOne({ _id: req.params.id, instituteId });
		if (!parent) {
			return res.status(404).json({ message: "Parent not found" });
		}

		return res.status(200).json(parent);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch parent", error: error.message });
	}
});

// ✅ POST create or update parent profile (for saving parent edits)
router.post("/", async (req, res) => {
	try {
		const instituteId = normalizeValue(req.body.instituteId);
		const studentId = normalizeValue(req.body.studentId || req.body._id || "");
		const studentName = normalizeValue(req.body.studentName || req.body.fullName || "");
		const parentPassword = normalizeValue(req.body.parentPassword);

		if (!instituteId || !studentId || !parentPassword) {
			return res.status(400).json({ message: "instituteId, studentId, and parentPassword are required" });
		}

		const institute = await findInstitute(instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const payload = {
			instituteId,
			instituteName: institute.name || "",
			studentId,
			studentName,
			parentId: studentName,
			parentName: normalizeValue(req.body.parentName || ""),
			parentEmail: normalizeValue(req.body.parentEmail || req.body.email || "").toLowerCase(),
			parentPassword,
			parentPhoneNumber: normalizeValue(req.body.parentPhoneNumber || ""),
			address: normalizeValue(req.body.address || ""),
			parentPhoto: normalizeValue(req.body.parentPhoto || ""),
			dateOfBirth: normalizeValue(req.body.dateOfBirth || ""),
			academicYear: normalizeValue(req.body.academicYear || ""),
			createdBy: req.body.createdBy || {},
		};

		// ✅ Find or create parent record by institute + studentId (one parent per student)
		const parent = await Parent.findOneAndUpdate(
			{ instituteId, studentId },
			{ $set: payload },
			{ new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
		);

		return res.status(201).json({
			message: "Parent profile saved successfully",
			parent,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to save parent profile", error: error.message });
	}
});

// ✅ POST /parent-login - Parent authentication (parentId + parentPassword)
router.post("/parent-login", async (req, res) => {
	try {
		const instituteId = (req.body.instituteId || "").trim();
		const parentId = normalizeValue(req.body.parentId || req.body.username);
		const parentPassword = normalizeValue(req.body.parentPassword || req.body.password);

		if (!parentId || !parentPassword) {
			return res.status(400).json({ message: "parentId and parentPassword are required" });
		}

		// ✅ Query Parent collection directly for authentication
		const escapedParentId = parentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const filter = {
			parentId: { $regex: `^${escapedParentId}$`, $options: "i" },
			parentPassword
		};
		if (instituteId) {
			filter.instituteId = instituteId;
		}

		const parent = await Parent.findOne(filter).sort({ createdAt: -1 });
		if (!parent) {
			return res.status(401).json({ message: "Invalid parent ID or parent password" });
		}

		return res.status(200).json({ message: "Parent login successful", parent });
	} catch (error) {
		return res.status(500).json({ message: "Failed to login parent", error: error.message });
	}
});

// ✅ PUT update parent profile by ID (for parent edits)
router.put("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || req.body.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const existingParent = await Parent.findOne({ _id: req.params.id, instituteId });
		if (!existingParent) {
			return res.status(404).json({ message: "Parent not found" });
		}

		const updatePayload = {};
		if (req.body.parentName !== undefined) updatePayload.parentName = normalizeValue(req.body.parentName);
		if (req.body.parentEmail !== undefined) updatePayload.parentEmail = normalizeValue(req.body.parentEmail).toLowerCase();
		if (req.body.parentPhoneNumber !== undefined) updatePayload.parentPhoneNumber = normalizeValue(req.body.parentPhoneNumber);
		if (req.body.address !== undefined) updatePayload.address = normalizeValue(req.body.address);
		if (req.body.parentPhoto !== undefined) updatePayload.parentPhoto = normalizeValue(req.body.parentPhoto);
		if (req.body.dateOfBirth !== undefined) updatePayload.dateOfBirth = normalizeValue(req.body.dateOfBirth);
		if (req.body.academicYear !== undefined) updatePayload.academicYear = normalizeValue(req.body.academicYear);
		if (req.body.createdBy?.adminName !== undefined) {
			updatePayload["createdBy.adminName"] = normalizeValue(req.body.createdBy.adminName);
		}
		if (req.body.createdBy?.email !== undefined) {
			updatePayload["createdBy.email"] = normalizeValue(req.body.createdBy.email).toLowerCase();
		}

		if (!Object.keys(updatePayload).length) {
			return res.status(400).json({ message: "No updatable fields provided" });
		}

		const updatedParent = await Parent.findByIdAndUpdate(
			req.params.id,
			{ $set: updatePayload },
			{ new: true, runValidators: true }
		);

		return res.status(200).json({
			message: "Parent profile updated successfully",
			parent: updatedParent,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to update parent profile", error: error.message });
	}
});

// ✅ DELETE parent record
router.delete("/:id", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		if (!instituteId) {
			return res.status(400).json({ message: "instituteId is required" });
		}

		const deletedParent = await Parent.findOneAndDelete({ _id: req.params.id, instituteId });
		if (!deletedParent) {
			return res.status(404).json({ message: "Parent not found" });
		}

		return res.status(200).json({
			message: "Parent record deleted successfully",
			parent: deletedParent,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete parent record", error: error.message });
	}
});

module.exports = router;