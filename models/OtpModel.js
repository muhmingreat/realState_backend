// models/OtpToken.js
const mongoose = require("mongoose");

const OtpTokenSchema = new mongoose.Schema({
  kycRequest: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "KYCRequest", 
    required: true 
  },

  // OTP fields
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },

  // Download token fields
  downloadToken: { type: String, default: null },
  downloadExpiresAt: { type: Date, default: null },
  downloadUsed: { type: Boolean, default: false }
}, 
{ timestamps: true }
);

module.exports = mongoose.model("OtpToken", OtpTokenSchema);






