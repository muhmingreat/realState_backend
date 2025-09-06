// backend/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in .env");
      process.exit(1);
    }

    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, );

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error(" MongoDB connection error:", error.message);

    // Show full error for debugging
    console.error(error);

    // Don't kill the server instantly, just retry every 5s
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
