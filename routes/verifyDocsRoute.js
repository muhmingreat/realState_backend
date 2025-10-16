const express  = require("express");
const { verifyDocs } = require ("../controllers/verifyDocsController");
const { docsUpload } = require ("../middleware/multer");

const router = express.Router();

// Use Multer middleware for the document upload
router.post("/", docsUpload.single("document"), verifyDocs);

module.exports = router;
