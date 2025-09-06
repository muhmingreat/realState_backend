// models/KYCRequest.js
const mongoose = require("mongoose");

const KYCRequestSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
   phoneNumber: { type: String, unique: true },
  documentType: { type: String, required: true },
  documentUrl: { type: String, required: true },
  selfieUrl: { type: String, default: null },

  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  providerResponse: { type: Object, default: {} }, 
}, { timestamps: true });

module.exports = mongoose.model("KYCRequest", KYCRequestSchema);
