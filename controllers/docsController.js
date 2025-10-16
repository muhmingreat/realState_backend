
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { uploadDocument, getDocumentByPropertyId } = require("../services/uploadService.js");
const KYCRequest = require("../models/KYCRequest.js");
const OtpToken = require("../models/OtpModel");
const { sendEmail } = require("../utils/email");

// -------------------- UPLOAD DOCS --------------------
exports.uploadDocs = async (req, res) => {
  try {
    const { propertyId, seller, buyerKycId } = req.body;
    console.log("uploadDocs req.body:", req.body);
    const file = req.file;

    if (!propertyId || !seller || !buyerKycId || !file) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Ensure docs folder
    const docsDir = path.join(process.cwd(), "docs");
    await fs.mkdir(docsDir, { recursive: true });

    // Move file
    const finalPath = path.join(docsDir, file.filename);
    await fs.rename(file.path, finalPath);

    // File hash
    const fileBuffer = await fs.readFile(finalPath);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Save metadata
    const fileUrl = `/docs/${file.filename}`;
    const doc = await uploadDocument({ propertyId, seller, fileUrl, fileHash });

    // ✅ Find buyer
    const buyer = await KYCRequest.findOne({ walletAddress: buyerKycId.toLowerCase() });
    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OtpToken.create({
      kycRequest: buyer._id,
      otp,
      expiresAt
    });

    // ✅ Send email
    await sendEmail(
      buyer.email,
      "New Property Document Available",
      `Hello ${buyer.fullName},

      A new document has been uploaded for property ID ${propertyId}.
      To download it, you must first verify this OTP:
      
      OTP: ${otp}
      
      This OTP will expire in 10 minutes.
      
      Best regards,
      Your Real Estate Platform`
    );

    res.status(201).json({ message: "Document uploaded, buyer notified with OTP", doc });
  } catch (error) {
    console.error("uploadDocs error:", error);
    res.status(500).json({ error: error.message });
  }
};

// -------------------- VERIFY OTP --------------------
exports.verifyOtp = async (req, res) => {
  try {
    const { buyerKycId, otp } = req.body;

    if (!buyerKycId || !otp) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const buyer = await KYCRequest.findOne({ walletAddress: buyerKycId.toLowerCase() });
    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    const token = await OtpToken.findOne({ kycRequest: buyer._id, otp, used: false });

    if (!token || token.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    token.used = true;

    // ✅ Generate temporary download token
    const downloadToken = crypto.randomBytes(16).toString("hex");
    token.downloadToken = downloadToken;
    token.downloadExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 
    token.downloadUsed = false;

    await token.save();

    res.json({ message: "OTP verified", downloadToken });
  } catch (error) {
    console.error("verifyOtp error:", error);
    res.status(500).json({ error: error.message });
  }
};

// -------------------- DOWNLOAD DOC --------------------
exports.downloadDoc = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { token } = req.query; // downloadToken

    if (!propertyId || !token) {
      return res.status(400).json({ error: "Missing propertyId or token" });
    }

    // ✅ Verify download token
    const otpRecord = await OtpToken.findOne({ downloadToken: token, downloadUsed: false });
    if (!otpRecord) {
      return res.status(403).json({ error: "Invalid or already used download token" });
    }

    if (otpRecord.downloadExpiresAt < Date.now()) {
      return res.status(403).json({ error: "Download token expired" });
    }

    // Mark token as used
    otpRecord.downloadUsed = true;
    await otpRecord.save();

    const doc = await getDocumentByPropertyId(Number(propertyId));
    if (!doc) {
      return res.status(404).json({ error: "No document found" });
    }

    const filePath = path.join(process.cwd(), "docs", path.basename(doc.fileUrl));
    return res.download(filePath, path.basename(doc.fileUrl));
  } catch (error) {
    console.error("downloadDoc error:", error);
    res.status(500).json({ error: error.message });
  }
};


// -------------------- RESEND OTP --------------------
exports.resendOtp = async (req, res) => {
  try {
    const { buyerKycId, propertyId } = req.body;

    if (!buyerKycId || !propertyId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const buyer = await KYCRequest.findOne({ walletAddress: buyerKycId.toLowerCase() });
    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    // Invalidate old OTPs for this buyer
    await OtpToken.updateMany({ kycRequest: buyer._id, used: false }, { used: true });

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpToken.create({
      kycRequest: buyer._id,
      otp,
      expiresAt
    });

    // Send email with new OTP
    await sendEmail(
      buyer.email,
      "Your new OTP for document download",
      `Hello ${buyer.fullName},

      You requested a new OTP to download your property document for ID ${propertyId}.
      
      OTP: ${otp}

      This OTP will expire in 10 minutes.

      Best regards,
      Your Real Estate Platform`
    );

    res.json({ message: "New OTP sent to buyer's email" });
  } catch (error) {
    console.error("resendOtp error:", error);
    res.status(500).json({ error: error.message });
  }
};






