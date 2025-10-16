// controllers/messageController.js
const Message = require("../models/Message");
const KYCRequest = require("../models/KYCRequest");

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { senderWallet, receiverWallet, message, room } = req.body;
        console.log("📩 sendMessage called:", { senderWallet, receiverWallet, message, room });

    // Find sender
    const sender = await KYCRequest.findOne({ walletAddress: senderWallet });

    console.log("🔍 Sender:", sender?.walletAddress);
    console.log("🔍 Receiver:", receiver?.walletAddress);
    if (!sender) {
      return res.status(400).json({ success: false, error: "Sender not found in KYC" });
    }

    // Receiver optional (for room chats)
    let receiver = null;
    if (receiverWallet) {
      receiver = await KYCRequest.findOne({ walletAddress: receiverWallet });
      if (!receiver) {
        return res.status(400).json({ success: false, error: "Receiver not found in KYC" });
      }
    }



    const newMessage = new Message({
      sender: sender._id,
      receiver: receiver ? receiver._id : null,
      message,
      room,
    });
console.log("✅ Message saved with id:", newMessage._id);

    await newMessage.save();

    const populatedMessage = await newMessage
      .populate("sender", "fullName walletAddress email")
      .populate("receiver", "fullName walletAddress email");
  console.log("📦 Populated Message:", populatedMessage);
    res.status(201).json({ success: true, data: populatedMessage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get 1-to-1 conversation
exports.getConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const kyc1 = await KYCRequest.findOne({ walletAddress: user1 });
    const kyc2 = await KYCRequest.findOne({ walletAddress: user2 });

    if (!kyc1 || !kyc2) {
      return res.status(400).json({ success: false, error: "One or both users not found in KYC" });
    }

    const messages = await Message.find({
      $or: [
        { sender: kyc1._id, receiver: kyc2._id },
        { sender: kyc2._id, receiver: kyc1._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName walletAddress email")
      .populate("receiver", "fullName walletAddress email");

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get room messages
exports.getRoomMessages = async (req, res) => {
  try {
    const { room } = req.params;

    const messages = await Message.find({ room })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName walletAddress email")
      .populate("receiver", "fullName walletAddress email");

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark all messages in a room as read
exports.markAsRead = async (req, res) => {
  try {
    const { room, userWallet } = req.body;

    const user = await KYCRequest.findOne({ walletAddress: userWallet });
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found in KYC" });
    }

    // ✅ FIX: only works if you add "readBy" to schema
    await Message.updateMany(
      { room, readBy: { $ne: user._id } },
      { $addToSet: { readBy: user._id } }
    );

    res.json({ success: true, message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all conversations for a user (chat list)
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await KYCRequest.findById(userId);
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found in KYC" });
    }

    const messages = await Message.find({
      $or: [{ sender: user._id }, { receiver: user._id }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "fullName walletAddress email")
      .populate("receiver", "fullName walletAddress email");

    // Extract latest conversation per partner
    const conversations = {};
    messages.forEach((msg) => {
      const other =
        msg.sender._id.toString() === user._id.toString()
          ? msg.receiver
          : msg.sender;

      if (!other) return; // skip if group chat with no receiver

      if (!conversations[other._id]) {
        conversations[other._id] = {
          user: other,
          lastMessage: msg,
        };
      }
    });

    res.json({ success: true, data: Object.values(conversations) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};



