const express = require ('express')
const { generateStagedImage } = require ("../controllers/replicateController.js");

const router = express.Router();

router.post("/generate", generateStagedImage);

module.exports = router;
