
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { promisify } = require("util");
const dns = require("dns");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

dns.lookup("kyc-uploader.s3.eu-north-1.amazonaws.com", (err, address) => {
  if (err) return console.error("DNS lookup failed:", err);
  console.log("Address:", address);
});


// AWS SDK v3

const unlinkAsync = promisify(fs.unlink);

const S3_BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION || "us-east-1";
const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;

const isS3Enabled = AWS_KEY && AWS_SECRET && S3_BUCKET;
console.log("Current S3 Region:", REGION);

let s3Client = null;
if (isS3Enabled) {
  s3Client = new S3Client({
    credentials: {
      accessKeyId: AWS_KEY,
      secretAccessKey: AWS_SECRET,
    },
    region: REGION,
  });
}

/**
 * Uploads a file to S3 or falls back to local storage.
 * @param {string} filePath - Local file path
 * @returns {Promise<string>} - Public or relative file URL
 */
async function storeFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const originalName = path.basename(filePath);
    const uniqueName = `${Date.now()}-${originalName}`;

    if (s3Client) {
      const fileContent = fs.readFileSync(filePath);
      const key = `kyc/${uniqueName}`;

      const params = {
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileContent,
        ACL: "private", // Keep KYC files private
      };
   console.log("Uploading file to S3 with params:", params);
   console.log("Uploading file to S3 with params:", params);
      await s3Client.send(new PutObjectCommand(params));

      // Remove local file after successful upload
      await unlinkAsync(filePath);

      return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    } else {
      // Local storage fallback
      const uploadsDir = path.resolve(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const destinationPath = path.join(uploadsDir, uniqueName);
      fs.copyFileSync(filePath, destinationPath);
      await unlinkAsync(filePath);

      return `/uploads/${uniqueName}`;
    }
  } catch (error) {
    console.error("File storage error:", error);
    throw error;
  }
}

module.exports = { storeFile };
