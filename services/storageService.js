const dns = require( "dns");

const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { promisify } = require("util");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");

const unlinkAsync = promisify(fs.unlink);
dns.setDefaultResultOrder("ipv4first");
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
 * Upload file to S3 or local storage
 */
async function storeFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

    const originalName = path.basename(filePath);
    const uniqueName = `${Date.now()}-${originalName}`;

    if (s3Client) {
      const fileContent = fs.readFileSync(filePath);
      const key = `kyc/${uniqueName}`;

      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileContent,
        ACL: "private",
      }));

      await unlinkAsync(filePath);

      return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    } else {
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

/**
 * Fetch stored file as Buffer (S3 or local)
 */
async function fetchFileBuffer(fileUrl) {
  try {
    if (!fileUrl) return null;

    if (fileUrl.startsWith("http")) {
      const res = await axios.get(fileUrl, { responseType: "arraybuffer" });
      return Buffer.from(res.data);
    }

    // const localPath = path.join(process.cwd(), fileUrl);
        // Handle local paths (absolute or relative)
    const localPath = path.isAbsolute(fileUrl) ? fileUrl : path.join(process.cwd(), fileUrl);
    if (!fs.existsSync(localPath)) throw new Error(`Local file not found: ${localPath}`);
    return fs.readFileSync(localPath);
  } catch (error) {
    console.error("fetchFileBuffer error:", error);
    throw error;
  }
}

module.exports = { storeFile, fetchFileBuffer };



