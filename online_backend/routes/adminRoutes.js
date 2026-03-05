const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getAllUsers, getUserById, updateUserRole, deleteUser } = require("../controllers/adminController");

// Admin dashboard route
router.get("/dashboard", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Admin dashboard access granted", user: req.user });
});

// User management routes
router.get("/users", protect, authorize("admin"), getAllUsers);
router.get("/users/:id", protect, authorize("admin"), getUserById);
router.put("/users/:id/role", protect, authorize("admin"), updateUserRole);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);

module.exports = router;