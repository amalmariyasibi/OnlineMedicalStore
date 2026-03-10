// Enhanced ML-based sentiment analysis using Natural library
const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

// Sentiment analyzer using Natural's Bayes classifier
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

// Enhanced keyword lists for better accuracy
const positiveWords = [
  "good", "great", "excellent", "fast", "quick", "happy", "satisfied",
  "nice", "awesome", "perfect", "love", "thank you", "amazing", "wonderful",
  "fantastic", "brilliant", "outstanding", "superb", "helpful", "friendly",
  "professional", "quality", "fresh", "timely", "recommend", "best"
];

const negativeWords = [
  "bad", "slow", "late", "worst", "poor", "unhappy", "angry", "terrible",
  "awful", "delay", "problem", "issue", "damaged", "expired", "wrong",
  "missing", "rude", "unprofessional", "disappointed", "waste", "never"
];

// Category keywords for tagging
const categoryKeywords = {
  delivery: ["delivery", "delivered", "courier", "shipping", "arrived", "late", "on time", "fast delivery"],
  product: ["product", "medicine", "quality", "fresh", "expired", "damaged", "packaging"],
  service: ["service", "customer service", "support", "helpful", "rude", "professional"],
  price: ["price", "expensive", "cheap", "value", "cost", "affordable"],
  packaging: ["packaging", "packed", "box", "sealed", "damaged packaging"]
};

const normalize = (text) =>
  (text || "")
    .toString()
    .trim()
    .toLowerCase();

// Extract tags from text based on keywords
function extractTags(text) {
  const normalized = normalize(text);
  const tags = [];
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      tags.push(category);
    }
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

// Enhanced sentiment analysis with ML
function analyzeSentiment(comment) {
  const text = normalize(comment);
  
  if (!text || text.length < 3) {
    return { 
      label: "neutral", 
      score: 0, 
      confidence: 0,
      tags: []
    };
  }

  // Tokenize the text
  const tokens = tokenizer.tokenize(text);
  
  // Use Natural's sentiment analyzer (AFINN-based)
  const sentimentScore = analyzer.getSentiment(tokens);
  
  // Rule-based keyword counting for additional context
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((w) => {
    if (text.includes(w)) positiveCount += 1;
  });

  negativeWords.forEach((w) => {
    if (text.includes(w)) negativeCount += 1;
  });

  // Combine ML score with keyword-based score
  const keywordScore = positiveCount - negativeCount;
  const combinedScore = (sentimentScore * 0.7) + (keywordScore * 0.3);
  
  // Normalize to -1 to 1 range
  const normalizedScore = Math.max(-1, Math.min(1, combinedScore / 5));
  
  // Calculate confidence based on text length and keyword matches
  const totalKeywords = positiveCount + negativeCount;
  const lengthFactor = Math.min(tokens.length / 10, 1);
  const keywordFactor = Math.min(totalKeywords / 3, 1);
  const confidence = (lengthFactor * 0.5 + keywordFactor * 0.5);

  // Determine label with adjusted thresholds
  let label = "neutral";
  if (normalizedScore > 0.15) {
    label = "positive";
  } else if (normalizedScore < -0.15) {
    label = "negative";
  }
  
  // Extract relevant tags
  const tags = extractTags(text);

  return { 
    label, 
    score: normalizedScore,
    confidence: Math.round(confidence * 100) / 100,
    tags
  };
}

// Analyze multiple feedbacks to get insights
function analyzeFeedbackTrends(feedbacks) {
  if (!feedbacks || feedbacks.length === 0) {
    return {
      totalCount: 0,
      averageRating: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      commonTags: [],
      trend: "stable"
    };
  }

  const totalCount = feedbacks.length;
  const avgRating = feedbacks.reduce((sum, f) => sum + (f.ratingOverall || 0), 0) / totalCount;
  
  const sentimentCounts = {
    positive: feedbacks.filter(f => f.sentimentLabel === "positive").length,
    neutral: feedbacks.filter(f => f.sentimentLabel === "neutral").length,
    negative: feedbacks.filter(f => f.sentimentLabel === "negative").length
  };

  // Extract all tags and count frequency
  const tagFrequency = {};
  feedbacks.forEach(f => {
    (f.tags || []).forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });

  const commonTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  // Determine trend (compare recent vs older feedbacks)
  let trend = "stable";
  if (feedbacks.length >= 10) {
    const recentCount = Math.floor(feedbacks.length / 3);
    const recent = feedbacks.slice(0, recentCount);
    const older = feedbacks.slice(recentCount);
    
    const recentAvg = recent.reduce((sum, f) => sum + (f.ratingOverall || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, f) => sum + (f.ratingOverall || 0), 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) trend = "improving";
    else if (recentAvg < olderAvg - 0.5) trend = "declining";
  }

  return {
    totalCount,
    averageRating: Math.round(avgRating * 10) / 10,
    sentimentDistribution: sentimentCounts,
    commonTags,
    trend
  };
}

module.exports = { 
  analyzeSentiment,
  analyzeFeedbackTrends,
  extractTags
};
