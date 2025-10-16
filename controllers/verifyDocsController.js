const fs = require ("fs");
const { checkDocuments }  = require ("../services/verifyDocsService.js");
const { formatToBytes32 }  = require ("../utils/hashUtil.js");
const { safeUnlink }  = require ("../middleware/multer.js");

exports.verifyDocs = async (req, res) => {
  const jobRunID = req.body.id || "1";

  if (!req.file) {
    return res.status(400).json({ error: "Document file is required" });
  }

  const { propertyId } = req.body;
  const documentPath = req.file.path;

  try {
    // Read uploaded file and hash
    const fileBuffer = fs.readFileSync(documentPath);
    const docsHash = fileBuffer.toString("hex").slice(0, 64);

    // ✅ Check in MongoDB whether it matches stored hash
    const { verified, docHash } = await checkDocuments(propertyId, docsHash);

    // Format hash for solidity (bytes32)
    const formattedHash = formatToBytes32(docHash);

    // Return Chainlink node adapter style response
    res.json({
      jobRunID,
      data: { verified, docHash: formattedHash },
      statusCode: 200,
    });
  } catch (error) {
    console.error("verifyDocs error:", error);
    res.status(500).json({
      jobRunID,
      status: "errored",
      error: error.message,
    });
  } finally {
    // Always clean up temp file
    await safeUnlink(documentPath);
  }
};



