const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove deprecated options that are no longer needed
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;