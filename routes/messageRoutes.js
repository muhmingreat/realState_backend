// routes/messageRoutes.js
const express = require("express");
const messageController = require("../controllers/messageController");

const router = express.Router();

// Send a message (REST + DB)
router.post("/", messageController.sendMessage);

// Get a 1-to-1 conversation by wallet addresses
router.get("/conversation/:user1/:user2", messageController.getConversation);

// Get all messages in a specific room (group or buyer/seller)
router.get("/room/:room", messageController.getRoomMessages);

// Mark messages in a room as read by user
router.post("/mark-read", messageController.markAsRead);

// Get all conversations (chat list) for a specific userId
router.get("/user/:userId/conversations", messageController.getUserConversations);

module.exports = router;
