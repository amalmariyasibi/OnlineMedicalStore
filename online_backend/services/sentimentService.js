// Simple rule-based sentiment analysis for feedback comments
// This is lightweight and keeps everything on the backend.

const positiveWords = [
  "good",
  "great",
  "excellent",
  "fast",
  "quick",
  "happy",
  "satisfied",
  "nice",
  "awesome",
  "perfect",
  "love",
  "thank you",
];

const negativeWords = [
  "bad",
  "slow",
  "late",
  "worst",
  "poor",
  "unhappy",
  "angry",
  "terrible",
  "awful",
  "delay",
  "problem",
  "issue",
];

const normalize = (text) =>
  (text || "")
    .toString()
    .trim()
    .toLowerCase();

function analyzeSentiment(comment) {
  const text = normalize(comment);
  if (!text) {
    return { label: "neutral", score: 0 };
  }

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((w) => {
    if (text.includes(w)) positiveCount += 1;
  });

  negativeWords.forEach((w) => {
    if (text.includes(w)) negativeCount += 1;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { label: "neutral", score: 0 };
  }

  const score = (positiveCount - negativeCount) / total; // -1 .. 1

  let label = "neutral";
  if (score > 0.2) label = "positive";
  else if (score < -0.2) label = "negative";

  return { label, score };
}

module.exports = { analyzeSentiment };
