const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

// Delivery dashboard route
router.get("/dashboard", protect, authorize("deliveryBoy"), (req, res) => {
  res.json({ message: "Delivery dashboard access granted", user: req.user });
});

// Get assigned deliveries route
router.get("/assignments", protect, authorize("deliveryBoy"), (req, res) => {
  res.json({ message: "Delivery boy can view assigned deliveries" });
});

// Update delivery status route
router.put("/assignments/:id/status", protect, authorize("deliveryBoy"), (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }
  
  // Validate status
  if (!['picked', 'in-transit', 'delivered'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  
  res.json({ message: `Delivery status updated to ${status}` });
});

module.exports = router;