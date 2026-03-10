const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");

// Customer routes
router.post("/:orderId", protect, feedbackController.upsertFeedback);
router.get("/my/:orderId", protect, feedbackController.getMyFeedbackForOrder);
router.get("/my", protect, feedbackController.getMyFeedbacks);

// Delivery personnel routes
router.get("/delivery/summary", protect, feedbackController.getDeliverySummary);
router.get("/delivery/personnel/:personnelId", protect, feedbackController.getDeliveryPersonnelRating);

// Admin routes
router.get("/admin/all", protect, feedbackController.getAllFeedbacks);
router.get("/admin/analytics", protect, feedbackController.getFeedbackAnalytics);
router.put("/admin/respond/:feedbackId", protect, feedbackController.respondToFeedback);

module.exports = router;
