

const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "KYCRequest", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "KYCRequest", required: true },
  message: { type: String, required: true },
  room: { type: String, default: null },
  read: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model("Message", MessageSchema);