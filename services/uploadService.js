const Document = require ("../models/Document.js");

exports.uploadDocument = async ({ propertyId, seller, fileUrl, fileHash }) => {
  const doc = new Document({ propertyId, seller, fileUrl, fileHash });
  return await doc.save();
};

exports.getDocumentByPropertyId = async (propertyId) => {
  return await Document.findOne({ propertyId });
};
