const express = require("express");
const router = express.Router();

// Simple in-memory dataset simulating WHO/Kaggle style data
// Each record links a disease to its common symptoms and recommended medicines.
const diseaseDataset = [
  {
    id: "fever",
    name: "Fever",
    category: "Common",
    symptoms: ["high temperature", "chills", "sweating", "headache"],
    medicines: [
      {
        id: "paracetamol-500",
        name: "Paracetamol 500mg",
        dosage: "500mg every 4-6 hours (max 4g/day)",
        otc: true,
      },
      {
        id: "ibuprofen-400",
        name: "Ibuprofen 400mg",
        dosage: "400mg every 6-8 hours after food",
        otc: true,
      },
    ],
  },
  {
    id: "common-cold",
    name: "Common Cold",
    category: "Respiratory",
    symptoms: ["runny nose", "sneezing", "sore throat", "mild cough", "congestion"],
    medicines: [
      {
        id: "cetirizine-10",
        name: "Cetirizine 10mg",
        dosage: "10mg once daily at night",
        otc: true,
      },
      {
        id: "steam-inhalation",
        name: "Steam Inhalation",
        dosage: "2-3 times per day",
        otc: true,
      },
    ],
  },
  {
    id: "headache",
    name: "Headache",
    category: "Neurological",
    symptoms: ["head pain", "pressure", "sensitivity to light", "fatigue"],
    medicines: [
      {
        id: "paracetamol-650",
        name: "Paracetamol 650mg",
        dosage: "650mg every 6 hours (max 4g/day)",
        otc: true,
      },
      {
        id: "rest-hydration",
        name: "Rest and Hydration",
        dosage: "Plenty of fluids, 6-8 hours sleep",
        otc: true,
      },
    ],
  },
  {
    id: "hypertension",
    name: "Hypertension",
    category: "Cardiovascular",
    symptoms: ["high blood pressure", "headache", "dizziness", "blurred vision"],
    medicines: [
      {
        id: "amlodipine-5",
        name: "Amlodipine 5mg",
        dosage: "5mg once daily",
        otc: false,
      },
      {
        id: "losartan-50",
        name: "Losartan 50mg",
        dosage: "50mg once daily",
        otc: false,
      },
    ],
  },
];

// Helper: normalize text
const normalize = (text) =>
  (text || "")
    .toString()
    .trim()
    .toLowerCase();

// Very simple KNN-like scoring: count overlapping symptom tokens between
// query and dataset symptoms. This is NOT a clinical system, it's only for demo.
const scoreDiseaseByQuery = (disease, queryTokens) => {
  const symptomTokens = new Set(
    disease.symptoms.flatMap((s) => normalize(s).split(/[^a-z0-9]+/).filter(Boolean))
  );

  let score = 0;
  queryTokens.forEach((t) => {
    if (symptomTokens.has(t)) score += 1;
  });

  return score;
};

// GET /api/ml/recommend-medicines?diseaseId=...&q=...
// - diseaseId: direct lookup
// - q: free-text symptoms (e.g. "fever, headache, chills")
router.get("/recommend-medicines", (req, res) => {
  try {
    const { diseaseId, q } = req.query;

    // 1) Try direct diseaseId match if provided
    let matchedDisease = null;
    if (diseaseId) {
      const idNorm = normalize(diseaseId);
      matchedDisease = diseaseDataset.find(
        (d) => normalize(d.id) === idNorm || normalize(d.name) === idNorm
      );
    }

    // 2) If no direct match, or only query is provided, use simple KNN-like matching
    if (!matchedDisease && q) {
      const queryTokens = new Set(
        normalize(q)
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
      );

      let bestScore = 0;
      let bestDisease = null;
      diseaseDataset.forEach((disease) => {
        const s = scoreDiseaseByQuery(disease, queryTokens);
        if (s > bestScore) {
          bestScore = s;
          bestDisease = disease;
        }
      });

      if (bestScore > 0) {
        matchedDisease = bestDisease;
      }
    }

    if (!matchedDisease) {
      return res.status(404).json({
        success: false,
        message:
          "No matching disease found for the given diseaseId or symptoms. Please refine your input.",
      });
    }

    // Build response with medicines and some safety notes
    const response = {
      success: true,
      disease: {
        id: matchedDisease.id,
        name: matchedDisease.name,
        category: matchedDisease.category,
        symptoms: matchedDisease.symptoms,
      },
      medicines: matchedDisease.medicines,
      disclaimer:
        "This is an educational, AI-style recommendation based on a small demo dataset. It is not a substitute for professional medical advice. Always consult a qualified doctor before starting or stopping any medicine.",
    };

    return res.json(response);
  } catch (err) {
    console.error("/api/ml/recommend-medicines error", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while generating recommendations.",
    });
  }
});

// Helper endpoint to list available diseases for frontend dropdowns/cards
router.get("/diseases", (req, res) => {
  const diseases = diseaseDataset.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    symptoms: d.symptoms,
  }));
  res.json({ success: true, diseases });
});

module.exports = router;
