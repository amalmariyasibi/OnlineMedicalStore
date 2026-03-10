const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Overall ratings
    ratingOverall: { type: Number, min: 1, max: 5, required: true },
    ratingProduct: { type: Number, min: 1, max: 5 },
    ratingDelivery: { type: Number, min: 1, max: 5 },
    ratingPackaging: { type: Number, min: 1, max: 5 },
    
    // Delivery personnel rating
    deliveryPersonnel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deliveryRating: { type: Number, min: 1, max: 5 },
    deliveryComment: { type: String, default: "" },
    
    // General feedback
    comment: { type: String, default: "" },
    
    // ML-based sentiment analysis
    sentimentLabel: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    sentimentScore: { type: Number, default: 0 },
    sentimentConfidence: { type: Number, default: 0 },
    
    // Additional metadata
    tags: [{ type: String }], // Auto-generated tags from ML analysis
    isResolved: { type: Boolean, default: false },
    adminResponse: { type: String, default: "" },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

feedbackSchema.index({ orderId: 1, customer: 1 }, { unique: true });
feedbackSchema.index({ deliveryPersonnel: 1 });
feedbackSchema.index({ sentimentLabel: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
