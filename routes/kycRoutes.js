const express = require("express");
const router = express.Router();
const kycController = require("../controllers/kycController");



router.post("/upload", kycController.uploadKYC);


router.post("/approve", kycController.approveKYC);
router.post("/reject", kycController.rejectKYC);


router.get("/requests", kycController.listRequests);
router.get("/requests/:wallet", kycController.getRequestByWallet);


router.get("/approved", kycController.getApprovedUsers);


router.get("/verification/:requestId", kycController.getVerificationByRequest);


router.put("/verification/:id", kycController.updateVerification);
router.get("/verifications", kycController.listVerifications);

module.exports = router;





