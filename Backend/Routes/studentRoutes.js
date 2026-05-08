const express = require("express");
const Student = require("../Models/Student");
const Institute = require("../Models/Institute");
const Parent = require("../Models/Parent");

const router = express.Router();
const { generateToken } = require('../Middleware/authMiddleware');

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
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

		const students = await Student.find({ instituteId }).sort({ createdAt: -1 });
		return res.status(200).json(students);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch students", error: error.message });
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

		const student = await Student.findOne({ _id: req.params.id, instituteId });
		if (!student) {
			return res.status(404).json({ message: "Student not found" });
		}

		return res.status(200).json(student);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch student", error: error.message });
	}
});

router.post("/", async (req, res) => {
	try {
		const payload = {
			instituteId: (req.body.instituteId || "").trim(),
			instituteName: "",
			fullName: (req.body.fullName || "").trim(),
			dateOfBirth: (req.body.dateOfBirth || "").trim(),
			academicYear: (req.body.academicYear || "").trim(),
			studentPassword: (req.body.studentPassword || "password").trim() || "password",
			parentPassword: (req.body.parentPassword || "parentpassword").trim() || "parentpassword",
			parentId: (req.body.parentId || req.body.fullName || "").trim(),
			parentName: (req.body.parentName || "").trim(),
			parentPhoneNumber: (req.body.parentPhoneNumber || "").trim(),
			studentId: (req.body.studentId || req.body.fullName || "").trim(),
			studentPhoneNumber: (req.body.studentPhoneNumber || "").trim(),
			studentEmail: (req.body.studentEmail || req.body.email || "").trim().toLowerCase(),
			studentPhoto: (req.body.studentPhoto || "").trim(),
			advancedFeePayment: (req.body.advancedFeePayment || "").trim(),
			totalFees: (req.body.totalFees || "").trim(),
			address: (req.body.address || "").trim(),
			createdBy: req.body.createdBy || {},
		};

		if (!payload.instituteId || !payload.fullName) {
			return res.status(400).json({ message: "instituteId and fullName are required" });
		}

		const institute = await findInstitute(payload.instituteId);
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		payload.instituteName = institute.name || "";

		const student = await Student.create(payload);

		// ✅ Auto-create/update Parent record so parent login works immediately
		try {
			const parentPayload = {
				instituteId: payload.instituteId,
				instituteName: payload.instituteName,
				studentId: payload.studentId || payload.fullName,
				studentName: payload.fullName,
				parentId: payload.fullName, // parentId = student's full name
				parentName: payload.parentName,
				parentPassword: payload.parentPassword,
				parentPhoneNumber: payload.parentPhoneNumber,
				address: payload.address,
				dateOfBirth: payload.dateOfBirth,
				academicYear: payload.academicYear,
				createdBy: payload.createdBy,
			};
			await Parent.findOneAndUpdate(
				{ instituteId: payload.instituteId, studentId: parentPayload.studentId },
				{ $set: parentPayload },
				{ new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
			);
		} catch (parentErr) {
			console.error('⚠️ Failed to auto-create parent record:', parentErr.message);
		}

		return res.status(201).json(student);
	} catch (error) {
		return res.status(500).json({ message: "Failed to create student", error: error.message });
	}
});

router.post("/login", async (req, res) => {
	try {
		const username = (req.body.username || req.body.fullName || "").trim();
		const password = (req.body.password || req.body.studentPassword || "").trim();

		if (!username || !password) {
			return res.status(400).json({ message: "username and password are required" });
		}

		const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const student = await Student.findOne({
			fullName: { $regex: `^${escapedUsername}$`, $options: "i" },
			studentPassword: password,
		}).sort({ createdAt: -1 });

		if (!student) {
			return res.status(401).json({ message: "Invalid username or password" });
		}

		const token = generateToken({
			id: student._id,
			role: 'student',
			studentId: student.studentId,
			instituteId: student.instituteId,
		});

		return res.status(200).json({
			message: "Student login successful",
			token,
			student,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to login student", error: error.message });
	}
});

router.put("/:id", async (req, res) => {
	try {
		const studentId = (req.params.id || "").trim();
		if (!studentId) {
			return res.status(400).json({ message: "student id is required" });
		}

		const existingStudent = await Student.findById(studentId);
		if (!existingStudent) {
			return res.status(404).json({ message: "Student not found" });
		}

		const requestInstituteId = (req.body.instituteId || "").trim().toLowerCase();
		const storedInstituteId = (existingStudent.instituteId || "").trim().toLowerCase();
		// Only check institute match if requestInstituteId is provided
		if (requestInstituteId && requestInstituteId !== storedInstituteId) {
			console.warn(`⚠️ Institute mismatch for student ${studentId}:`, { 
				storedInstituteId: existingStudent.instituteId,
				requestInstituteId: req.body.instituteId,
				normalized: { stored: storedInstituteId, request: requestInstituteId }
			});
			return res.status(403).json({ 
				message: "Institute mismatch",
				expected: existingStudent.instituteId,
				provided: req.body.instituteId 
			});
		}

		const updatePayload = {};
		if (req.body.fullName !== undefined) {
			updatePayload.fullName = (req.body.fullName || "").trim();
		}
		if (req.body.dateOfBirth !== undefined) {
			updatePayload.dateOfBirth = (req.body.dateOfBirth || "").trim();
		}
		if (req.body.academicYear !== undefined) {
			updatePayload.academicYear = (req.body.academicYear || "").trim();
		}
		if (req.body.studentPhoneNumber !== undefined) {
			updatePayload.studentPhoneNumber = (req.body.studentPhoneNumber || "").trim();
		}
		if (req.body.parentPhoneNumber !== undefined) {
			updatePayload.parentPhoneNumber = (req.body.parentPhoneNumber || "").trim();
		}
		if (req.body.parentName !== undefined) {
			updatePayload.parentName = (req.body.parentName || "").trim();
		}
		if (req.body.address !== undefined) {
			updatePayload.address = (req.body.address || "").trim();
		}
		if (req.body.studentEmail !== undefined) {
			updatePayload.studentEmail = (req.body.studentEmail || req.body.email || "").trim().toLowerCase();
		}
		if (req.body.studentPhoto !== undefined) {
			updatePayload.studentPhoto = (req.body.studentPhoto || "").trim();
		}
		if (req.body.totalFees !== undefined) {
			updatePayload.totalFees = (req.body.totalFees || "").trim();
		}
		if (req.body.createdBy?.email !== undefined) {
			updatePayload["createdBy.email"] = (req.body.createdBy.email || "").trim().toLowerCase();
		}

		if (!Object.keys(updatePayload).length) {
			return res.status(400).json({ message: "No updatable fields provided" });
		}

		const updatedStudent = await Student.findByIdAndUpdate(
			studentId,
			{ $set: updatePayload },
			{ new: true, runValidators: true },
		);

		return res.status(200).json(updatedStudent);
	} catch (error) {
		console.error("❌ Student update error:", error);
		return res.status(500).json({ 
			message: "Failed to update student",
			error: error.message,
			details: error.toString()
		});
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

		const deletedStudent = await Student.findOneAndDelete({ _id: req.params.id, instituteId });
		if (!deletedStudent) {
			return res.status(404).json({ message: "Student not found" });
		}

		return res.status(200).json({ message: "Student deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete student", error: error.message });
	}
});

module.exports = router;