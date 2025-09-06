
const express = require( "express");
const { getGeocode } = require( "../controllers/geocodeController.js");

const router = express.Router();


router.get("/", getGeocode);

module.exports = router;
