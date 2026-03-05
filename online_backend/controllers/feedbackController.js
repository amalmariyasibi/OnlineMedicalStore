const Feedback = require("../models/Feedback");
const { analyzeSentiment } = require("../services/sentimentService");

// Create or update feedback for an order by the logged-in customer
const upsertFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { ratingOverall, comment } = req.body;

    if (!ratingOverall) {
      return res.status(400).json({ message: "ratingOverall is required" });
    }

    if (ratingOverall < 1 || ratingOverall > 5) {
      return res.status(400).json({ message: "ratingOverall must be between 1 and 5" });
    }

    const sentiment = analyzeSentiment(comment || "");

    const feedbackData = {
      orderId,
      customer: req.user._id,
      ratingOverall,
      comment: comment || "",
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score,
    };

    const feedback = await Feedback.findOneAndUpdate(
      { orderId, customer: req.user._id },
      feedbackData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(feedback);
  } catch (err) {
    console.error("Error in upsertFeedback", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get feedback for a specific order by current user
const getMyFeedbackForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const feedback = await Feedback.findOne({ orderId, customer: req.user._id });

    if (!feedback) {
      return res.status(404).json({ message: "No feedback found for this order" });
    }

    return res.status(200).json(feedback);
  } catch (err) {
    console.error("Error in getMyFeedbackForOrder", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Basic summary for a delivery user: average rating across their completed orders (by orderId list)
// To keep it minimal and independent of your order storage, we accept orderIds via query.
const getDeliverySummary = async (req, res) => {
  try {
    const { orderIds } = req.query; // comma-separated list
    if (!orderIds) {
      return res.status(400).json({ message: "orderIds query param is required" });
    }

    const ids = orderIds.split(",").map((id) => id.trim()).filter(Boolean);
    if (!ids.length) {
      return res.status(400).json({ message: "No valid orderIds provided" });
    }

    const feedbacks = await Feedback.find({ orderId: { $in: ids } });

    if (!feedbacks.length) {
      return res.status(200).json({
        averageRating: null,
        count: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
      });
    }

    const sum = feedbacks.reduce((acc, f) => acc + (f.ratingOverall || 0), 0);
    const averageRating = sum / feedbacks.length;

    const positive = feedbacks.filter((f) => f.sentimentLabel === "positive").length;
    const neutral = feedbacks.filter((f) => f.sentimentLabel === "neutral").length;
    const negative = feedbacks.filter((f) => f.sentimentLabel === "negative").length;

    return res.status(200).json({
      averageRating,
      count: feedbacks.length,
      positive,
      neutral,
      negative,
    });
  } catch (err) {
    console.error("Error in getDeliverySummary", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  upsertFeedback,
  getMyFeedbackForOrder,
  getDeliverySummary,
};
