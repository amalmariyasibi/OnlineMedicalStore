const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratingOverall: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
    sentimentLabel: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    sentimentScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

feedbackSchema.index({ orderId: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
