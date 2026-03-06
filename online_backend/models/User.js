const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firebaseUid: { type: String, unique: true, sparse: true },
  displayName: { type: String },
  role: { type: String, enum: ["customer", "admin", "deliveryBoy", "delivery"], default: "customer" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
