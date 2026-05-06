const express = require("express");
const Message = require("../Models/Message");
const Institute = require("../Models/Institute");

const router = express.Router();

const findInstitute = async (instituteId) => {
	return Institute.findOne({ instituteId }, { _id: 0, instituteId: 1, name: 1 }).lean();
};

const normalizeValue = (value) => (value || "").trim();

// ✅ GET all messages for a recipient (with filters)
router.get("/", async (req, res) => {
	try {
		const instituteId = normalizeValue(req.query.instituteId);
		const receiverId = normalizeValue(req.query.receiverId);
		const isRead = req.query.isRead;
		const messageType = normalizeValue(req.query.messageType);

		if (!instituteId || !receiverId) {
			return res.status(400).json({ message: "instituteId and receiverId are required" });
		}

		const filter = { instituteId, receiverId };
		if (isRead !== undefined) filter.isRead = isRead === "true";
		if (messageType) filter.messageType = messageType;

		const messages = await Message.find(filter).sort({ createdAt: -1 });
		return res.status(200).json(messages);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch messages", error: error.message });
	}
});

// ✅ GET unread message count for a recipient
router.get("/unread-count/:receiverId", async (req, res) => {
	try {
		const instituteId = (req.query.instituteId || "").trim();
		const receiverId = (req.params.receiverId || "").trim();

		if (!instituteId || !receiverId) {
			return res.status(400).json({ message: "instituteId and receiverId are required" });
		}

		const count = await Message.countDocuments({
			instituteId,
			receiverId,
			isRead: false,
		});

		return res.status(200).json({ unreadCount: count });
	} catch (error) {
		return res.status(500).json({ message: "Failed to count unread messages", error: error.message });
	}
});

// ✅ GET single message by ID
router.get("/:id", async (req, res) => {
	try {
		const message = await Message.findById(req.params.id);
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		return res.status(200).json(message);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch message", error: error.message });
	}
});

// ✅ POST create new message
router.post("/", async (req, res) => {
	try {
		const instituteId = normalizeValue(req.body.instituteId);
		const senderId = normalizeValue(req.body.senderId);
		const receiverId = normalizeValue(req.body.receiverId);
		const content = normalizeValue(req.body.content);

		if (!instituteId || !senderId || !receiverId || !content) {
			return res.status(400).json({
				message: "instituteId, senderId, receiverId, and content are required",
			});
		}

		const institute = await findInstitute(instituteId);

		const newMessage = new Message({
			instituteId,
			instituteName: institute?.name || "",
			senderId,
			senderName: normalizeValue(req.body.senderName || ""),
			senderRole: normalizeValue(req.body.senderRole || "student"),
			receiverId,
			receiverName: normalizeValue(req.body.receiverName || ""),
			receiverRole: normalizeValue(req.body.receiverRole || "student"),
			subject: normalizeValue(req.body.subject || ""),
			content,
			attachment: normalizeValue(req.body.attachment || ""),
			messageType: normalizeValue(req.body.messageType || "personal"),
			isRead: false,
		});

		const savedMessage = await newMessage.save();
		return res.status(201).json({
			message: "Message created successfully",
			data: savedMessage,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to create message", error: error.message });
	}
});

// ✅ PUT mark message as read
router.put("/:id/mark-read", async (req, res) => {
	try {
		const message = await Message.findByIdAndUpdate(
			req.params.id,
			{ $set: { isRead: true } },
			{ new: true }
		);

		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		return res.status(200).json({
			message: "Message marked as read",
			data: message,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to update message", error: error.message });
	}
});

// ✅ PUT update message (only for unsent messages or by sender)
router.put("/:id", async (req, res) => {
	try {
		const existingMessage = await Message.findById(req.params.id);
		if (!existingMessage) {
			return res.status(404).json({ message: "Message not found" });
		}

		const updatePayload = {};
		if (req.body.subject !== undefined) updatePayload.subject = normalizeValue(req.body.subject);
		if (req.body.content !== undefined) updatePayload.content = normalizeValue(req.body.content);
		if (req.body.attachment !== undefined) updatePayload.attachment = normalizeValue(req.body.attachment);
		if (req.body.messageType !== undefined) updatePayload.messageType = normalizeValue(req.body.messageType);

		if (!Object.keys(updatePayload).length) {
			return res.status(400).json({ message: "No updatable fields provided" });
		}

		const updatedMessage = await Message.findByIdAndUpdate(
			req.params.id,
			{ $set: updatePayload },
			{ new: true, runValidators: true }
		);

		return res.status(200).json({
			message: "Message updated successfully",
			data: updatedMessage,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to update message", error: error.message });
	}
});

// ✅ DELETE message
router.delete("/:id", async (req, res) => {
	try {
		const deletedMessage = await Message.findByIdAndDelete(req.params.id);

		if (!deletedMessage) {
			return res.status(404).json({ message: "Message not found" });
		}

		return res.status(200).json({
			message: "Message deleted successfully",
			data: deletedMessage,
		});
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete message", error: error.message });
	}
});

module.exports = router;
