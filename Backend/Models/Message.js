const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
	{
		instituteId: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		instituteName: {
			type: String,
			trim: true,
			default: "",
		},
		senderId: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		senderName: {
			type: String,
			trim: true,
			default: "",
		},
		senderRole: {
			type: String,
			enum: ["student", "parent", "teacher", "admin", "committee"],
			default: "student",
		},
		receiverId: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		receiverName: {
			type: String,
			trim: true,
			default: "",
		},
		receiverRole: {
			type: String,
			enum: ["student", "parent", "teacher", "admin", "committee"],
			default: "student",
		},
		subject: {
			type: String,
			trim: true,
			default: "",
		},
		content: {
			type: String,
			trim: true,
			default: "",
		},
		isRead: {
			type: Boolean,
			default: false,
			index: true,
		},
		attachment: {
			type: String,
			trim: true,
			default: "",
		},
		messageType: {
			type: String,
			enum: ["personal", "announcement", "feedback", "notification"],
			default: "personal",
		},
	},
	{ timestamps: true }
);

// ✅ Compound indexes for efficient querying
messageSchema.index({ instituteId: 1, receiverId: 1, isRead: 1 });
messageSchema.index({ instituteId: 1, senderId: 1 });
messageSchema.index({ instituteId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
