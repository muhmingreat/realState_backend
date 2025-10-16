const express = require("express");
const { uploadDocs, verifyOtp, downloadDoc, resendOtp } = require("../controllers/docsController"); 
const { docsUpload } = require("../middleware/multer");
const router = express.Router();

// ----------------- UPLOAD -----------------
router.post("/", (req, res) => {
  docsUpload.single("document")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    uploadDocs(req, res).catch(err =>
      res.status(500).json({ error: err.message })
    );
  });
});

// ----------------- VERIFY OTP -----------------
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// ----------------- DOWNLOAD -----------------
router.get("/:propertyId/download", downloadDoc);

module.exports = router;




// const express =require ("express");
// const { uploadDocs, getDocs, downloadDoc } = require ( "../controllers/uploadController.js");
// const { docsUpload } = require("../middleware/multer.js");
// const router = express.Router();

// // POST /upload
// // router.post("/",  docsUpload.single("document"), uploadDocs);
// router.post("/", (req, res) => {
//   docsUpload.single("document")(req, res, (err) => {
//     if (err) return res.status(400).json({ error: err.message });
//     uploadDocs(req, res).catch(err => res.status(500).json({ error: err.message }));
//   });
// });

// router.get("/:propertyId", getDocs);
// router.get("/:propertyId/download", downloadDoc);
// module.exports =  router;
