// controllers/geocodeController.js
const axios = require( "axios");

exports.getGeocode = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) {
      return res.status(400).json({ error: "Missing address query parameter" });
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          format: "json",
          limit: 1,
          q,
        },
        headers: {
          "User-Agent": "my-real-estate-app/1.0 (ayatullahmuhmin3@gmail.com)",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Geocode error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
