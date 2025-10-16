const { RekognitionClient, CompareFacesCommand, DetectTextCommand } = 
require("@aws-sdk/client-rekognition");

/**
 * Create Rekognition client with credentials + region
 */
const rekognition = new RekognitionClient({
  region: process.env.S3_REGION_1 || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
// console.log(rekognition);

/**
 * Compare a selfie with an ID document face
 * @param {Buffer} selfieBuffer 
 * @param {Buffer} idBuffer 
 */
async function compareFaces(selfieBuffer, idBuffer) {
  const command = new CompareFacesCommand({
    SourceImage: { Bytes: selfieBuffer },
    TargetImage: { Bytes: idBuffer },
    SimilarityThreshold: 80, // pass if >= 80%
  });

  const response = await rekognition.send(command);
  return (
    response.FaceMatches.length > 0 &&
    response.FaceMatches[0].Similarity >= 80
  );
}

/**
 * Extract text from an ID document (OCR)
 * @param {Buffer} idBuffer 
 */
async function extractIdText(idBuffer) {
  const command = new DetectTextCommand({
    Image: { Bytes: idBuffer },
  });

  const response = await rekognition.send(command);
  return response.TextDetections
    .filter((item) => item.Type === "LINE")
    .map((item) => item.DetectedText);
}

module.exports = { compareFaces, extractIdText };

