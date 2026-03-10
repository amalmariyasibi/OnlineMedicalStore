const Feedback = require("../models/Feedback");
const { analyzeSentiment, analyzeFeedbackTrends } = require("../services/sentimentService");

// Create or update feedback for an order by the logged-in customer
const upsertFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      ratingOverall, 
      ratingProduct,
      ratingDelivery,
      ratingPackaging,
      deliveryPersonnel,
      deliveryRating,
      deliveryComment,
      comment 
    } = req.body;

    if (!ratingOverall) {
      return res.status(400).json({ message: "ratingOverall is required" });
    }

    if (ratingOverall < 1 || ratingOverall > 5) {
      return res.status(400).json({ message: "ratingOverall must be between 1 and 5" });
    }

    // Analyze sentiment from both general and delivery comments
    const combinedComment = `${comment || ""} ${deliveryComment || ""}`.trim();
    const sentiment = analyzeSentiment(combinedComment);

    const feedbackData = {
      orderId,
      customer: req.user._id,
      ratingOverall,
      ratingProduct: ratingProduct || ratingOverall,
      ratingDelivery: ratingDelivery || ratingOverall,
      ratingPackaging: ratingPackaging || ratingOverall,
      deliveryPersonnel: deliveryPersonnel || null,
      deliveryRating: deliveryRating || null,
      deliveryComment: deliveryComment || "",
      comment: comment || "",
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score,
      sentimentConfidence: sentiment.confidence,
      tags: sentiment.tags,
    };

    const feedback = await Feedback.findOneAndUpdate(
      { orderId, customer: req.user._id },
      feedbackData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('customer', 'name email')
     .populate('deliveryPersonnel', 'name email');

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
    const feedback = await Feedback.findOne({ orderId, customer: req.user._id })
      .populate('deliveryPersonnel', 'name email');

    if (!feedback) {
      return res.status(404).json({ message: "No feedback found for this order" });
    }

    return res.status(200).json(feedback);
  } catch (err) {
    console.error("Error in getMyFeedbackForOrder", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all feedbacks by the current user
const getMyFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ customer: req.user._id })
      .populate('deliveryPersonnel', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(feedbacks);
  } catch (err) {
    console.error("Error in getMyFeedbacks", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Basic summary for a delivery user: average rating across their completed orders
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
      averageRating: Math.round(averageRating * 10) / 10,
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

// Get delivery personnel rating summary
const getDeliveryPersonnelRating = async (req, res) => {
  try {
    const { personnelId } = req.params;
    
    const feedbacks = await Feedback.find({ 
      deliveryPersonnel: personnelId,
      deliveryRating: { $exists: true, $ne: null }
    }).populate('customer', 'name');

    if (!feedbacks.length) {
      return res.status(200).json({
        personnelId,
        averageRating: null,
        totalRatings: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentFeedbacks: []
      });
    }

    const totalRating = feedbacks.reduce((sum, f) => sum + (f.deliveryRating || 0), 0);
    const averageRating = totalRating / feedbacks.length;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(f => {
      const rating = Math.round(f.deliveryRating);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    const recentFeedbacks = feedbacks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(f => ({
        orderId: f.orderId,
        rating: f.deliveryRating,
        comment: f.deliveryComment,
        customerName: f.customer?.name,
        date: f.createdAt
      }));

    return res.status(200).json({
      personnelId,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: feedbacks.length,
      ratingDistribution,
      recentFeedbacks
    });
  } catch (err) {
    console.error("Error in getDeliveryPersonnelRating", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin: Get all feedbacks with filters
const getAllFeedbacks = async (req, res) => {
  try {
    const { 
      sentiment, 
      minRating, 
      maxRating, 
      startDate, 
      endDate,
      limit = 50,
      page = 1 
    } = req.query;

    const query = {};
    
    if (sentiment) {
      query.sentimentLabel = sentiment;
    }
    
    if (minRating) {
      query.ratingOverall = { ...query.ratingOverall, $gte: parseFloat(minRating) };
    }
    
    if (maxRating) {
      query.ratingOverall = { ...query.ratingOverall, $lte: parseFloat(maxRating) };
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedbacks = await Feedback.find(query)
      .populate('customer', 'name email')
      .populate('deliveryPersonnel', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Feedback.countDocuments(query);

    return res.status(200).json({
      feedbacks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Error in getAllFeedbacks", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin: Get feedback analytics
const getFeedbackAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const feedbacks = await Feedback.find({
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    const trends = analyzeFeedbackTrends(feedbacks);

    // Calculate average ratings by category
    const avgRatings = {
      overall: 0,
      product: 0,
      delivery: 0,
      packaging: 0
    };

    if (feedbacks.length > 0) {
      avgRatings.overall = feedbacks.reduce((sum, f) => sum + (f.ratingOverall || 0), 0) / feedbacks.length;
      avgRatings.product = feedbacks.reduce((sum, f) => sum + (f.ratingProduct || 0), 0) / feedbacks.length;
      avgRatings.delivery = feedbacks.reduce((sum, f) => sum + (f.ratingDelivery || 0), 0) / feedbacks.length;
      avgRatings.packaging = feedbacks.reduce((sum, f) => sum + (f.ratingPackaging || 0), 0) / feedbacks.length;
    }

    // Get top delivery personnel
    const deliveryRatings = await Feedback.aggregate([
      { 
        $match: { 
          deliveryPersonnel: { $exists: true, $ne: null },
          deliveryRating: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: "$deliveryPersonnel",
          averageRating: { $avg: "$deliveryRating" },
          totalRatings: { $sum: 1 }
        }
      },
      { $sort: { averageRating: -1 } },
      { $limit: 10 }
    ]);

    return res.status(200).json({
      period: `Last ${days} days`,
      trends,
      averageRatings: {
        overall: Math.round(avgRatings.overall * 10) / 10,
        product: Math.round(avgRatings.product * 10) / 10,
        delivery: Math.round(avgRatings.delivery * 10) / 10,
        packaging: Math.round(avgRatings.packaging * 10) / 10
      },
      topDeliveryPersonnel: deliveryRatings
    });
  } catch (err) {
    console.error("Error in getFeedbackAnalytics", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin: Respond to feedback
const respondToFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ message: "Response is required" });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        adminResponse: response,
        respondedAt: new Date(),
        isResolved: true
      },
      { new: true }
    ).populate('customer', 'name email')
     .populate('deliveryPersonnel', 'name email');

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    return res.status(200).json(feedback);
  } catch (err) {
    console.error("Error in respondToFeedback", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  upsertFeedback,
  getMyFeedbackForOrder,
  getMyFeedbacks,
  getDeliverySummary,
  getDeliveryPersonnelRating,
  getAllFeedbacks,
  getFeedbackAnalytics,
  respondToFeedback
};
