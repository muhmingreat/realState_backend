const { compareFaces, extractIdText } = require("../services/kycVerification");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const fsp = require("fs/promises");
const KYCRequest = require("../models/KYCRequest");
const KYCVerification = require("../models/KYCVerification");
const { storeFile } = require("../services/storageService");
const { verifyOnChain } = require("../services/blockchainService");


// Multer storage setup
const storage = multer.diskStorage({
  destination: path.join(process.cwd(), "tmp_uploads"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Allowed: jpeg, png, webp, pdf."));
    }
    cb(null, true);
  },
});

// Helper to safely delete temp files
async function safeUnlink(filePath) {
  try {
    await fsp.unlink(filePath);
  } catch {
    // ignore
  }
}

exports.uploadKYC = [
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),

  async (req, res) => {
    try {
      const { walletAddress: rawWallet, fullName, email, phoneNumber, documentType } = req.body;

      if (!rawWallet || !fullName || !email || !phoneNumber || !documentType) {
        if (req.files) Object.values(req.files).flat().forEach(f => safeUnlink(f.path));
        return res.status(400).json({ error: "walletAddress, fullName, email, phoneNumber, and documentType are required" });
      }

      const walletAddress = rawWallet.toLowerCase();

      // Helper function inside handler
      function normalizePhoneNumber(phone) {
        if (!phone || typeof phone !== "string") return "";
        phone = phone.replace(/\D/g, ""); // remove non-numeric characters
        if (phone.startsWith("0")) phone = "234" + phone.slice(1);
        if (!phone.startsWith("234")) phone = "234" + phone;
        return "+" + phone;
      }

      const phoneNumberNormalized = normalizePhoneNumber(phoneNumber);

      // Check duplicate
      const existing = await KYCRequest.findOne({ walletAddress });
      if (existing && existing.status === "pending") {
        if (req.files) Object.values(req.files).flat().forEach(f => safeUnlink(f.path));
        return res.status(400).json({ error: "Existing pending KYC request found" });
      }

      // Read files
      const idBuffer = fs.readFileSync(req.files.document[0].path);
      const selfieBuffer = req.files.selfie ? fs.readFileSync(req.files.selfie[0].path) : null;

      // Upload to storage
      const documentUrl = await storeFile(req.files.document[0].path);
      const selfieUrl = req.files.selfie ? await storeFile(req.files.selfie[0].path) : null;

      // Verification
      let documentVerified = false;
      let documentExtractedName = "";
      let faceMatch = false;

      if (idBuffer) {
        const textLines = await extractIdText(idBuffer);
        documentExtractedName = textLines.join(" ");
        documentVerified = textLines.some(line =>
          fullName.toLowerCase().includes(line.toLowerCase())
        );
      }

      if (idBuffer && selfieBuffer) {
        faceMatch = await compareFaces(selfieBuffer, idBuffer);
      }

      // Save request
      const newRequest = existing
        ? Object.assign(existing, { fullName, email, phoneNumber: phoneNumberNormalized, documentType, documentUrl, selfieUrl, status: "pending" })
        : new KYCRequest({ walletAddress, fullName, email, phoneNumber: phoneNumberNormalized, documentType, documentUrl, selfieUrl });

      await newRequest.save();

      // Save verification result
      let verification = await KYCVerification.findOne({ requestId: newRequest._id });
      if (!verification) {
        verification = new KYCVerification({
          requestId: newRequest._id,
          livenessScore: 0,
          documentExtractedName,
          documentVerified,
          faceMatch,
        });
      } else {
        verification.documentExtractedName = documentExtractedName;
        verification.documentVerified = documentVerified;
        verification.faceMatch = faceMatch;
      }
      await verification.save();

      return res.json({
        success: true,
        message: "KYC request submitted and verification processed.",
        request: newRequest,
        verification,
      });

    } catch (error) {
      console.error("uploadKYC error:", error);
      if (req.files) Object.values(req.files).flat().forEach(f => safeUnlink(f.path));
      return res.status(500).json({ error: error.message || "Server error" });
    }
  }
];


// exports.uploadKYC = [
//   upload.fields([
//     { name: "document", maxCount: 1 },
//     { name: "selfie", maxCount: 1 },
//   ]),

//   function normalizePhoneNumber(phone) {
//   if (!phone) return "";
//   phone = phone.replace(/\D/g, ""); // remove non-numeric characters
//   if (phone.startsWith("0")) phone = "234" + phone.slice(1); // 0814 → 234814
//   if (!phone.startsWith("234")) phone = "234" + phone;       // ensure country code
//   return "+" + phone;                                        // +234...
// },

//   async (req, res) => {
//     try {
//       const { walletAddress: rawWallet, fullName, email, phoneNumber, documentType } = req.body;

//       if (!rawWallet || !fullName || !email || !phoneNumber || !documentType) {
//         if (req.files) Object.values(req.files).flat().forEach(f => safeUnlink(f.path));
//         return res.status(400).json({ error: "walletAddress, fullName, email, phoneNumber, and documentType are required" });
//       }

//       const walletAddress = rawWallet.toLowerCase();

//       // Check duplicate
//       const existing = await KYCRequest.findOne({ walletAddress });
//       if (existing && existing.status === "pending") {
//         Object.values(req.files).flat().forEach(f => safeUnlink(f.path));
//         return res.status(400).json({ error: "Existing pending KYC request found" });
//       }
     
//       // 🟢 Read buffers FIRST (before storeFile deletes files)
//       const idBuffer = fs.readFileSync(req.files.document[0].path);
//       const selfieBuffer = req.files.selfie
//         ? fs.readFileSync(req.files.selfie[0].path)
//         : null;

//       // Then upload to storage (storeFile will delete tmp file)
//       const documentUrl = await storeFile(req.files.document[0].path);
//       const selfieUrl = req.files.selfie
//         ? await storeFile(req.files.selfie[0].path)
//         : null;

//       // Rekognition checks
//       let documentVerified = false;
//       let documentExtractedName = "";
//       let faceMatch = false;

//       if (idBuffer) {
//         const textLines = await extractIdText(idBuffer);
//         documentExtractedName = textLines.join(" ");
//         documentVerified = textLines.some(line =>
//           fullName.toLowerCase().includes(line.toLowerCase())
//         );
//       }

//       if (idBuffer && selfieBuffer) {
//         faceMatch = await compareFaces(selfieBuffer, idBuffer);
//       }
        
//       // Save request
//       // const newRequest = existing
//       //   ? Object.assign(existing, { fullName, email, phoneNumber, documentType, documentUrl, selfieUrl, status: "pending" })
//       //   : new KYCRequest({ walletAddress, fullName, email, phoneNumber, documentType, documentUrl, selfieUrl });
//       const phoneNumberNormalized = normalizePhoneNumber(phoneNumber);

// // Save request
// const newRequest = existing
//   ? Object.assign(existing, { fullName, email, phoneNumber: phoneNumberNormalized, documentType, documentUrl, selfieUrl, status: "pending" })
//   : new KYCRequest({ walletAddress, fullName, email, phoneNumber: phoneNumberNormalized, documentType, documentUrl, selfieUrl });


//       await newRequest.save();


//       // Save verification result
//       let verification = await KYCVerification.findOne({ requestId: newRequest._id });
//       if (!verification) {
//         verification = new KYCVerification({
//           requestId: newRequest._id,
//           livenessScore: 0,
//           documentExtractedName,
//           documentVerified,
//           faceMatch,
//         });
//       } else {
//         verification.documentExtractedName = documentExtractedName;
//         verification.documentVerified = documentVerified;
//         verification.faceMatch = faceMatch;
//       }
//       await verification.save();

//       return res.json({
//         success: true,
//         message: "KYC request submitted and verification processed.",
//         request: newRequest,
//         verification,
//       });

//     } catch (error) {
//       console.error("uploadKYC error:", error);
//       if (req.files) Object.values(req.files).flat().forEach(f => safeUnlink(f.path));
//       return res.status(500).json({ error: error.message || "Server error" });
//     }
//   },
// ];

exports.approveKYC = async (req, res) => {
  try {
    const walletAddress = req.body.walletAddress?.toLowerCase();
    if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });

    const kyc = await KYCRequest.findOne({ walletAddress });
    if (!kyc) return res.status(404).json({ error: "KYC request not found" });
    if (kyc.status === "approved") return res.status(400).json({ error: "KYC already approved" });

    const receipt = await verifyOnChain(walletAddress);
    kyc.status = "approved";
    await kyc.save();

    
      return res.json({
      success: true,
      message: "KYC approved successfully",
      txHash: receipt.txHash,
      request: kyc,
    });
  } catch (error) {
    console.error("approveKYC error:", error);
    return res.status(500).json({ error: error.message || "Approval failed" });
  }
};

/**
 * Admin: Reject KYC request
 */
exports.rejectKYC = async (req, res) => {
  try {
    const walletAddress = req.body.walletAddress?.toLowerCase();
    const reason = req.body.reason || "Rejected by admin";
    if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });

    const kyc = await KYCRequest.findOne({ walletAddress });
    if (!kyc) return res.status(404).json({ error: "KYC request not found" });

    kyc.status = "rejected";
    kyc.providerResponse = { reason };
    await kyc.save();

    return res.json({ success: true, request: kyc });
  } catch (error) {
    console.error("rejectKYC error:", error);
    return res.status(500).json({ error: "Reject failed" });
  }
};

/**
 * List all KYC requests
 */
exports.listRequests = async (req, res) => {
  try {
    const list = await KYCRequest.find().sort({ createdAt: -1 }).limit(200);
    return res.json(list);
  } catch (error) {
    console.error("listRequests error:", error);
    return res.status(500).json({ error: "Failed to list KYC requests" });
  }
};

/**
 * Get KYC request by wallet
 */
exports.getRequestByWallet = async (req, res) => {
  try {
    const wallet = req.params.wallet?.toLowerCase();
    const request = await KYCRequest.findOne({ walletAddress: wallet });
    if (!request) return res.status(404).json({ error: "KYC request not found" });
    return res.json(request);
  } catch (error) {
    console.error("getRequestByWallet error:", error);
    return res.status(500).json({ error: "Failed to fetch KYC request" });
  }
};

/**
 * Verification CRUD
 */
// Update verification (admin or automated system)
exports.updateVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const verification = await KYCVerification.findById(id);
    if (!verification) return res.status(404).json({ error: "Verification record not found" });

    Object.assign(verification, updates);
    await verification.save();

    return res.json({ success: true, verification });
  } catch (error) {
    console.error("updateVerification error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

// Get verification by KYC request ID
exports.getVerificationByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const verification = await KYCVerification.findOne({ requestId }).populate(
      "requestId", "walletAddress fullName email status");
    if (!verification) return res.status(404).json({ error: "Verification not found" });
    return res.json(verification);
  } catch (error) {
    console.error("getVerificationByRequest error:", error);
    return res.status(500).json({ error: "Failed to fetch verification" });
  }
};

// List all verification records
exports.listVerifications = async (req, res) => {
  try {
    const verifications = await KYCVerification.find().populate(
      "requestId", "walletAddress fullName email status").sort({ createdAt: -1 });
    return res.json(verifications);
  } catch (error) {
    console.error("listVerifications error:", error);
    return res.status(500).json({ error: "Failed to list verifications" });
  }
};






