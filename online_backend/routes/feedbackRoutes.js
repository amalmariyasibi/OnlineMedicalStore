const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");

// Customer creates or updates feedback for an order
router.post("/:orderId", feedbackController.upsertFeedback);

// Customer gets their feedback for an order
router.get("/my/:orderId", feedbackController.getMyFeedbackForOrder);

// Delivery or admin can get a simple rating summary, given orderIds
router.get("/delivery/summary", feedbackController.getDeliverySummary);

module.exports = router;
