const axios = require( "axios");

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
console.log("Replicate Token:", REPLICATE_API_TOKEN);


exports.generateStagedImage = async (req, res) => {
  try {
    const body = req.body; // should contain { version, input }
// const body = req.body;
console.log("Incoming request body:", body);
if (!body.version || !body.input?.image) {
  return res.status(400).json({ error: "Missing version or image in request body" });
}
    const response = await axios.post(
      "https://api.replicate.com/v1/predictions",
      body,
      {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    let prediction = response.data;

    // Polling until finished
    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await axios.get(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } }
      );
      prediction = poll.data;
    }

    if (prediction.status === "succeeded") {
      res.json({ url: prediction.output[0] });
    } else {
      res.status(500).json({ error: "AI staging failed" });
    }

  } catch (error) {
    console.error("Error with Replicate API:", error);
    res.status(500).json({ error: "Replicate API request failed" });
  }
};
