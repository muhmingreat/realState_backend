// models/KYCVerification.js
const mongoose = require("mongoose");

const KYCVerificationSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "KYCRequest", required: true },
  livenessScore: { type: Number, default: 0 },
  documentExtractedName: { type: String, default: "" },
  documentVerified: { type: Boolean, default: false },
  faceMatch: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("KYCVerification", KYCVerificationSchema);
