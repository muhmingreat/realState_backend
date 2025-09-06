const express = require("express");
const router = express.Router();
const kycController = require("../controllers/kycController");


router.post("/upload", kycController.uploadKYC);


router.post("/approve", kycController.approveKYC);
router.post("/reject", kycController.rejectKYC);


router.get("/requests", kycController.listRequests);
router.get("/requests/:wallet", kycController.getRequestByWallet);




router.get("/verification/:requestId", kycController.getVerificationByRequest);


router.put("/verification/:id", kycController.updateVerification);
router.get("/verifications", kycController.listVerifications);

module.exports = router;






// // backend/src/routes/kycRoutes.js
// const express = require("express");
// const router = express.Router();
// const kycController = require("../controllers/kycController");

// // Public endpoint — user submits KYC documents
// router.post("/upload", kycController.uploadKYC);

// // Admin-only (should be protected by auth in production)
// router.post("/approve", kycController.approveKYC);
// router.post("/reject", kycController.rejectKYC);

// // Utility endpoints
// router.get("/requests", kycController.listRequests);
// router.get("/requests/:wallet", kycController.getRequestByWallet);

// module.exports = router;
