const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

// Customer profile route
router.get("/profile", protect, authorize("customer"), (req, res) => {
  res.json({ message: "Customer profile access granted", user: req.user });
});

// Customer orders route
router.get("/orders", protect, authorize("customer"), (req, res) => {
  res.json({ message: "Customer can view their orders" });
});

// Place new order route
router.post("/orders", protect, authorize("customer"), (req, res) => {
  // This would create a new order in the database
  res.status(201).json({ message: "Order placed successfully" });
});

module.exports = router;