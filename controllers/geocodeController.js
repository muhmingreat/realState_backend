// controllers/geocodeController.js
const axios = require("axios");

exports.getGeocode = async (req, res) => {
  try {
    let q = req.query.q;
    if (!q || !q.trim()) {
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
        timeout: 50000, // avoid hanging forever
      }
    );

    // If no results, fallback to Lagos
    if (!response.data || response.data.length === 0) {
      console.warn("Address not found, falling back:", q);
      return res.json([
        { lat: "6.5244", lon: "3.3792", display_name: "Lagos, Nigeria" },
      ]);
    }

    res.json(response.data);
  } catch (err) {
    console.error("Geocode error:", err.message);

    // Fallback: Lagos coordinates
    return res.status(200).json([
      { lat: "6.5244", lon: "3.3792", display_name: "Lagos, Nigeria (fallback)" },
    ]);
  }
};


