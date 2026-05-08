const express = require("express");
const crypto = require("crypto");
const Institute = require("../Models/Institute");
const Student = require("../Models/Student");
const razorpay = require("../Config/razorpayConfig");

const router = express.Router();

router.post("/:studentId/pay-fee/order", async (req, res) => {
	try {
		const { studentId } = req.params;
		const { amount } = req.body; // Amount in INR

		if (!amount || isNaN(amount) || amount <= 0) {
			return res.status(400).json({ message: "Valid amount is required" });
		}

		const student = await Student.findById(studentId);
		if (!student) {
			return res.status(404).json({ message: "Student not found" });
		}

		const institute = await Institute.findOne({ instituteId: student.instituteId });
		if (!institute) {
			return res.status(404).json({ message: "Institute not found" });
		}

		const instituteAccountId = institute.razorpayDetails?.accountId;
		if (!instituteAccountId) {
			return res.status(400).json({ 
				message: "Institute has not set up their payment account yet (Linked Account missing)." 
			});
		}

		if (!razorpay?.orders?.create) {
			return res.status(503).json({ message: "Razorpay is not configured on the server" });
		}

		const amountInPaise = Math.round(Number(amount) * 100);
		const receipt = `fee_${Date.now().toString(36)}_${studentId}`.slice(0, 40);

		// Razorpay Route: Transfer the amount immediately to the Institute's Linked Account
		const order = await razorpay.orders.create({
			amount: amountInPaise,
			currency: "INR",
			receipt,
			transfers: [
				{
					account: instituteAccountId,
					amount: amountInPaise, // 100% of the money goes to the institute
					currency: "INR",
					on_hold: 0 // Do not hold the funds, settle immediately
				}
			],
			notes: {
				studentId,
				instituteId: institute.instituteId,
				paymentType: "student_fee",
			},
		});

		return res.status(201).json({
			keyId: process.env.RAZORPAY_KEY_ID,
			order,
			student: {
				name: student.fullName,
				email: student.studentEmail,
				phone: student.studentPhoneNumber
			}
		});
	} catch (error) {
		console.error("Razorpay Order Error:", error);
		return res.status(500).json({
			message: "Failed to create fee payment order",
			error: error.message,
		});
	}
});

router.post("/:studentId/pay-fee/verify", async (req, res) => {
	try {
		const { studentId } = req.params;
		const {
			razorpay_order_id,
			razorpay_payment_id,
			razorpay_signature,
			amount
		} = req.body;

		if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
			return res.status(400).json({
				message: "Payment verification details are missing",
			});
		}

		const generatedSignature = crypto
			.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
			.update(`${razorpay_order_id}|${razorpay_payment_id}`)
			.digest("hex");

		const expectedSignature = Buffer.from(generatedSignature);
		const receivedSignature = Buffer.from(String(razorpay_signature));
		const signatureMatches =
			expectedSignature.length === receivedSignature.length &&
			crypto.timingSafeEqual(expectedSignature, receivedSignature);

		if (!signatureMatches) {
			return res.status(400).json({ message: "Payment verification failed: Invalid signature" });
		}

		// Update student fee record
		const student = await Student.findById(studentId);
		if (student) {
			const currentPaid = Number(student.advancedFeePayment) || 0;
			const newPaid = currentPaid + Number(amount || 0);
			student.advancedFeePayment = String(newPaid);
			
			// Add to fee history sequence
			if (!student.feeHistory) {
				student.feeHistory = [];
			}
			student.feeHistory.push({
				amount: String(amount || 0),
				date: new Date(),
				paymentId: razorpay_payment_id,
				status: "completed"
			});

			await student.save();
		}

		return res.status(200).json({
			message: "Fee payment successful and verified",
			paymentId: razorpay_payment_id,
		});
	} catch (error) {
		console.error("Payment Verification Error:", error);
		return res.status(500).json({
			message: "Failed to verify payment",
			error: error.message,
		});
	}
});

module.exports = router;
