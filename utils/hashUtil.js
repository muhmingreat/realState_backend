// Format docsHash to 32-byte hex (bytes32)
exports.formatToBytes32 = (hash) => {
  let hex = Buffer.from(hash).toString("hex");
  if (hex.length > 64) hex = hex.slice(0, 64); // truncate if too long
  return "0x" + hex.padEnd(64, "0");
};
