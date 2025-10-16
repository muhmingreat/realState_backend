// middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

// --- Create tmp_docs folder if it doesn't exist ---
const tmpDir = path.join(process.cwd(), "tmp_docs");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log("Created tmp_docs directory at:", tmpDir);
}

// --- Multer storage configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`;
    cb(null, safeName);
  }
});

// --- Allowed MIME types ---
const allowedTypes = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/jpg"
];

// --- Multer instance ---
const docsUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: PDF, TXT, JPG, PNG`));
    }
    cb(null, true);
  }
});

// --- Helper to safely delete temp files ---
async function safeUnlink(filePath) {
  try {
    await fsp.unlink(filePath);
  } catch (err) {
    console.warn("safeUnlink: file not found or already deleted:", filePath);
  }
}

module.exports = { docsUpload, safeUnlink };


