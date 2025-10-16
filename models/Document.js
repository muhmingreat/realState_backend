const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  propertyId: { type: Number, required: true },
  seller: { type: String, required: true },  // seller wallet address
  fileUrl: { type: String, required: true }, // IPFS or local storage URL
  fileHash: { type: String, required: true }, // hash of file
  status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" }
}, { timestamps: true });

module.exports =  mongoose.model("Document", DocumentSchema);
