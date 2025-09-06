const KYCVerification = require("../models/KYCVerification");
const KYCRequest = require("../models/KYCRequest");

// Create a new verification record
exports.createVerification = async (req, res) => {
  try {
    const { requestId, livenessScore,
             documentExtractedName, documentVerified, faceMatch } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: "requestId is required" });
    }

    // Ensure the KYC request exists
    const kycRequest = await KYCRequest.findById(requestId);
    if (!kycRequest) {
      return res.status(404).json({ error: "KYC request not found" });
    }

    const verification = new KYCVerification({
      requestId,
      livenessScore: livenessScore || 0,
      documentExtractedName: documentExtractedName || "",
      documentVerified: documentVerified || false,
      faceMatch: faceMatch || false,
    });

    await verification.save();

    return res.status(201).json({ success: true, verification });
  } catch (error) {
    console.error("createVerification error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

// Update an existing verification record
exports.updateVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const verification = await KYCVerification.findById(id);
    if (!verification) {
      return res.status(404).json({ error: "Verification record not found" });
    }

    Object.assign(verification, updates);
    await verification.save();

    return res.json({ success: true, verification });
  } catch (error) {
    console.error("updateVerification error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

// Get all verification records
exports.listVerifications = async (req, res) => {
  try {
    const verifications = await KYCVerification.find()
      .populate("requestId", "walletAddress fullName email status") // optional: include KYCRequest info
      .sort({ createdAt: -1 });

    return res.json(verifications);
  } catch (error) {
    console.error("listVerifications error:", error);
    return res.status(500).json({ error: "Failed to list verifications" });
  }
};

// Get verification by KYC request ID
exports.getVerificationByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const verification = await KYCVerification.findOne({ requestId })
      .populate("requestId", "walletAddress fullName email status");

    if (!verification) {
      return res.status(404).json({ error: "Verification not found for this request" });
    }

    return res.json(verification);
  } catch (error) {
    console.error("getVerificationByRequest error:", error);
    return res.status(500).json({ error: "Failed to fetch verification" });
  }
};

// Delete verification by ID
exports.deleteVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const verification = await KYCVerification.findByIdAndDelete(id);
    if (!verification) {
      return res.status(404).json({ error: "Verification record not found" });
    }

    return res.json({ success: true, message: "Verification deleted", verification });
  } catch (error) {
    console.error("deleteVerification error:", error);
    return res.status(500).json({ error: "Failed to delete verification" });
  }
};
