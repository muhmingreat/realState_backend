const Document = require ("../models/Document.js");

/**
 * Check if a document is authentic
 * 
 * @param {string} propertyId - The property ID from contract
 * @param {string} docsHash   - The hash of the uploaded document
 * @returns {Object} { verified: boolean, docHash: string }
 */
exports.checkDocuments = async (propertyId, docsHash) => {
  try {
    // Look up the stored doc in MongoDB
    const existingDoc = await Document.findOne({ propertyId });

    if (!existingDoc) {
      return { verified: false, docHash: docsHash };
    }

    // Compare stored hash with provided hash
    if (existingDoc.docsHash === docsHash) {
      return { verified: true, docHash: docsHash };
    }

    return { verified: false, docHash: docsHash };
  } catch (error) {
    console.error("Error verifying documents:", error);
    return { verified: false, docHash: docsHash };
  }
};
