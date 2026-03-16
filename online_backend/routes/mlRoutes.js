const express = require("express");
const router = express.Router();

// In-memory disease dataset — covers 25 common conditions across major categories.
const diseaseDataset = [
  // ── COMMON ──────────────────────────────────────────────────────────────────
  {
    id: "fever",
    name: "Fever",
    category: "Common",
    symptoms: ["high temperature", "chills", "sweating", "headache", "body heat", "hot skin"],
    medicines: [
      { id: "paracetamol-500", name: "Paracetamol 500mg", dosage: "500mg every 4-6 hours (max 4g/day)", otc: true },
      { id: "ibuprofen-400", name: "Ibuprofen 400mg", dosage: "400mg every 6-8 hours after food", otc: true },
      { id: "cold-compress", name: "Cold Compress / Wet Cloth", dosage: "Apply on forehead as needed", otc: true },
    ],
  },
  {
    id: "headache",
    name: "Headache",
    category: "Neurological",
    symptoms: ["head pain", "pressure in head", "sensitivity to light", "fatigue", "throbbing head"],
    medicines: [
      { id: "paracetamol-650", name: "Paracetamol 650mg", dosage: "650mg every 6 hours (max 4g/day)", otc: true },
      { id: "ibuprofen-400-h", name: "Ibuprofen 400mg", dosage: "400mg every 6-8 hours after food", otc: true },
      { id: "rest-hydration", name: "Rest and Hydration", dosage: "Plenty of fluids, 6-8 hours sleep", otc: true },
    ],
  },
  {
    id: "migraine",
    name: "Migraine",
    category: "Neurological",
    symptoms: ["severe headache", "migraine", "one sided head pain", "nausea with headache", "light sensitivity", "vomiting with headache", "pulsating pain"],
    medicines: [
      { id: "sumatriptan-50", name: "Sumatriptan 50mg", dosage: "1 tablet at onset, repeat after 2 hrs if needed", otc: false },
      { id: "naproxen-500", name: "Naproxen 500mg", dosage: "500mg at onset, then 250mg every 6-8 hours", otc: true },
      { id: "paracetamol-caffeine", name: "Paracetamol + Caffeine", dosage: "1-2 tablets as needed", otc: true },
    ],
  },

  // ── RESPIRATORY ─────────────────────────────────────────────────────────────
  {
    id: "common-cold",
    name: "Common Cold",
    category: "Respiratory",
    symptoms: ["runny nose", "sneezing", "sore throat", "mild cough", "nasal congestion", "blocked nose", "stuffy nose"],
    medicines: [
      { id: "cetirizine-10", name: "Cetirizine 10mg", dosage: "10mg once daily at night", otc: true },
      { id: "phenylephrine-para", name: "Phenylephrine + Paracetamol", dosage: "1 tablet every 6 hours", otc: true },
      { id: "steam-inhalation", name: "Steam Inhalation", dosage: "2-3 times per day for 10 minutes", otc: true },
      { id: "vitamin-c-500", name: "Vitamin C 500mg", dosage: "1 tablet daily", otc: true },
    ],
  },
  {
    id: "cough",
    name: "Cough",
    category: "Respiratory",
    symptoms: ["cough", "dry cough", "wet cough", "persistent cough", "chest congestion", "phlegm", "mucus", "throat irritation"],
    medicines: [
      { id: "dextromethorphan", name: "Dextromethorphan Syrup", dosage: "10ml every 6-8 hours", otc: true },
      { id: "ambroxol-30", name: "Ambroxol 30mg", dosage: "1 tablet 3 times daily after food", otc: true },
      { id: "honey-ginger-syrup", name: "Honey-Ginger Cough Syrup", dosage: "10ml 3-4 times daily", otc: true },
      { id: "levosalbutamol", name: "Levosalbutamol Inhaler", dosage: "1-2 puffs every 4-6 hours if needed", otc: false },
    ],
  },
  {
    id: "asthma",
    name: "Asthma",
    category: "Respiratory",
    symptoms: ["wheezing", "shortness of breath", "breathing difficulty", "chest tightness", "breathlessness", "asthma attack"],
    medicines: [
      { id: "salbutamol-inhaler", name: "Salbutamol Inhaler (Ventolin)", dosage: "1-2 puffs every 4-6 hours as needed", otc: false },
      { id: "budesonide-inhaler", name: "Budesonide Inhaler", dosage: "1-2 puffs twice daily (maintenance)", otc: false },
      { id: "montelukast-10", name: "Montelukast 10mg", dosage: "1 tablet once daily at night", otc: false },
    ],
  },
  {
    id: "flu",
    name: "Influenza (Flu)",
    category: "Respiratory",
    symptoms: ["flu", "influenza", "body ache", "high fever", "fatigue", "muscle pain", "chills with body pain", "weakness"],
    medicines: [
      { id: "oseltamivir-75", name: "Oseltamivir 75mg (Tamiflu)", dosage: "1 capsule twice daily for 5 days", otc: false },
      { id: "paracetamol-500-flu", name: "Paracetamol 500mg", dosage: "1-2 tablets every 4-6 hours", otc: true },
      { id: "multivitamin", name: "Multivitamin Tablet", dosage: "1 tablet daily with food", otc: true },
    ],
  },

  // ── DIGESTIVE ────────────────────────────────────────────────────────────────
  {
    id: "stomach-pain",
    name: "Stomach Pain",
    category: "Digestive",
    symptoms: ["stomach pain", "stomach ache", "abdominal pain", "belly pain", "tummy ache", "stomach cramps", "lower abdomen pain"],
    medicines: [
      { id: "antacid-digene", name: "Antacid Tablets (Digene)", dosage: "1-2 tablets after meals", otc: true },
      { id: "omeprazole-20", name: "Omeprazole 20mg", dosage: "1 capsule before breakfast", otc: true },
      { id: "buscopan-10", name: "Buscopan 10mg", dosage: "1 tablet 3 times daily for cramps", otc: true },
    ],
  },
  {
    id: "acidity",
    name: "Acidity / Heartburn",
    category: "Digestive",
    symptoms: ["acidity", "heartburn", "acid reflux", "burning sensation in chest", "sour belching", "burning stomach", "gas acidity"],
    medicines: [
      { id: "pantoprazole-40", name: "Pantoprazole 40mg", dosage: "1 tablet before breakfast daily", otc: true },
      { id: "ranitidine-150", name: "Ranitidine 150mg", dosage: "1 tablet twice daily", otc: true },
      { id: "eno-fruit-salt", name: "ENO Fruit Salt", dosage: "1 sachet in a glass of water as needed", otc: true },
      { id: "gelusil-syrup", name: "Gelusil Syrup", dosage: "10ml after meals and at bedtime", otc: true },
    ],
  },
  {
    id: "diarrhea",
    name: "Diarrhea",
    category: "Digestive",
    symptoms: ["diarrhea", "loose motion", "loose stools", "watery stool", "frequent stools", "upset stomach", "stomach upset"],
    medicines: [
      { id: "loperamide-2", name: "Loperamide 2mg", dosage: "2 tablets initially, then 1 after each loose stool (max 8/day)", otc: true },
      { id: "ors-sachet", name: "ORS Sachets", dosage: "1 sachet in 1L water, drink throughout the day", otc: true },
      { id: "metronidazole-400", name: "Metronidazole 400mg", dosage: "1 tablet 3 times daily for 5 days", otc: false },
      { id: "probiotic", name: "Probiotic Capsules (Lactobacillus)", dosage: "1 capsule twice daily", otc: true },
    ],
  },
  {
    id: "constipation",
    name: "Constipation",
    category: "Digestive",
    symptoms: ["constipation", "hard stool", "difficulty passing stool", "no bowel movement", "straining to pass stool", "bloating constipation"],
    medicines: [
      { id: "lactulose-syrup", name: "Lactulose Syrup", dosage: "15-30ml once or twice daily", otc: true },
      { id: "isabgol-husk", name: "Isabgol Husk (Psyllium)", dosage: "1-2 teaspoons in water before bed", otc: true },
      { id: "bisacodyl-5", name: "Bisacodyl 5mg", dosage: "1-2 tablets at bedtime", otc: true },
    ],
  },
  {
    id: "nausea-vomiting",
    name: "Nausea & Vomiting",
    category: "Digestive",
    symptoms: ["nausea", "vomiting", "feeling sick", "urge to vomit", "motion sickness", "travel sickness", "queasy"],
    medicines: [
      { id: "ondansetron-4", name: "Ondansetron 4mg", dosage: "1 tablet every 8 hours", otc: false },
      { id: "domperidone-10", name: "Domperidone 10mg", dosage: "1 tablet 3 times daily before meals", otc: true },
      { id: "ginger-capsules", name: "Ginger Capsules", dosage: "1-2 capsules as needed", otc: true },
      { id: "ors-vomiting", name: "ORS Solution", dosage: "Sip frequently to prevent dehydration", otc: true },
    ],
  },

  // ── CARDIOVASCULAR ──────────────────────────────────────────────────────────
  {
    id: "hypertension",
    name: "Hypertension",
    category: "Cardiovascular",
    symptoms: ["high blood pressure", "hypertension", "dizziness", "blurred vision", "frequent headache", "pounding heart"],
    medicines: [
      { id: "amlodipine-5", name: "Amlodipine 5mg", dosage: "5mg once daily", otc: false },
      { id: "losartan-50", name: "Losartan 50mg", dosage: "50mg once daily", otc: false },
      { id: "atenolol-50", name: "Atenolol 50mg", dosage: "50mg once daily in the morning", otc: false },
    ],
  },
  {
    id: "diabetes",
    name: "Diabetes",
    category: "Endocrine",
    symptoms: ["high blood sugar", "diabetes", "frequent urination", "excessive thirst", "unexplained weight loss", "blurry vision", "slow healing wounds", "fatigue diabetes"],
    medicines: [
      { id: "metformin-500", name: "Metformin 500mg", dosage: "1 tablet twice daily with meals", otc: false },
      { id: "glimepiride-1", name: "Glimepiride 1mg", dosage: "1 tablet once daily before breakfast", otc: false },
      { id: "insulin-regular", name: "Insulin (as prescribed)", dosage: "As directed by doctor", otc: false },
    ],
  },
  {
    id: "anemia",
    name: "Anemia",
    category: "Blood",
    symptoms: ["anemia", "low hemoglobin", "pale skin", "extreme tiredness", "weakness", "shortness of breath on exertion", "dizziness anemia", "cold hands and feet"],
    medicines: [
      { id: "ferrous-sulfate", name: "Ferrous Sulfate 200mg", dosage: "1 tablet twice daily after food", otc: true },
      { id: "folic-acid-5", name: "Folic Acid 5mg", dosage: "1 tablet once daily", otc: true },
      { id: "vitamin-b12", name: "Vitamin B12 500mcg", dosage: "1 tablet daily", otc: true },
    ],
  },

  // ── SKIN ─────────────────────────────────────────────────────────────────────
  {
    id: "skin-allergy",
    name: "Skin Allergy",
    category: "Dermatology",
    symptoms: ["skin rash", "itching", "skin allergy", "hives", "redness on skin", "skin irritation", "allergic rash", "urticaria"],
    medicines: [
      { id: "cetirizine-10-allergy", name: "Cetirizine 10mg", dosage: "1 tablet once daily at night", otc: true },
      { id: "hydrocortisone-cream", name: "Hydrocortisone 1% Cream", dosage: "Apply thin layer on affected area twice daily", otc: true },
      { id: "calamine-lotion", name: "Calamine Lotion", dosage: "Apply on affected area as needed", otc: true },
      { id: "fexofenadine-120", name: "Fexofenadine 120mg", dosage: "1 tablet once daily", otc: true },
    ],
  },
  {
    id: "acne",
    name: "Acne",
    category: "Dermatology",
    symptoms: ["acne", "pimples", "blackheads", "whiteheads", "oily skin breakout", "facial acne", "back acne", "skin breakout"],
    medicines: [
      { id: "benzoyl-peroxide", name: "Benzoyl Peroxide 2.5% Gel", dosage: "Apply on affected area once daily at night", otc: true },
      { id: "clindamycin-gel", name: "Clindamycin 1% Gel", dosage: "Apply twice daily on affected area", otc: false },
      { id: "salicylic-acid-wash", name: "Salicylic Acid Face Wash", dosage: "Use twice daily", otc: true },
    ],
  },
  {
    id: "fungal-infection",
    name: "Fungal Infection",
    category: "Dermatology",
    symptoms: ["fungal infection", "ringworm", "athlete's foot", "itchy skin patches", "scaly skin", "skin fungus", "jock itch", "nail fungus"],
    medicines: [
      { id: "clotrimazole-cream", name: "Clotrimazole 1% Cream", dosage: "Apply twice daily for 2-4 weeks", otc: true },
      { id: "fluconazole-150", name: "Fluconazole 150mg", dosage: "1 tablet as single dose (for severe cases)", otc: false },
      { id: "terbinafine-cream", name: "Terbinafine 1% Cream", dosage: "Apply once daily for 1-2 weeks", otc: true },
    ],
  },

  // ── MUSCULOSKELETAL ──────────────────────────────────────────────────────────
  {
    id: "back-pain",
    name: "Back Pain",
    category: "Musculoskeletal",
    symptoms: ["back pain", "lower back pain", "upper back pain", "spine pain", "backache", "lumbar pain", "back stiffness"],
    medicines: [
      { id: "ibuprofen-400-back", name: "Ibuprofen 400mg", dosage: "400mg every 6-8 hours after food", otc: true },
      { id: "diclofenac-gel", name: "Diclofenac Gel 1%", dosage: "Apply on affected area 3-4 times daily", otc: true },
      { id: "muscle-relaxant", name: "Thiocolchicoside 4mg", dosage: "1 tablet twice daily", otc: false },
      { id: "hot-pack", name: "Hot Water Bag / Heat Pack", dosage: "Apply for 15-20 minutes 2-3 times daily", otc: true },
    ],
  },
  {
    id: "joint-pain",
    name: "Joint Pain / Arthritis",
    category: "Musculoskeletal",
    symptoms: ["joint pain", "arthritis", "knee pain", "swollen joints", "stiff joints", "joint swelling", "rheumatoid arthritis", "osteoarthritis"],
    medicines: [
      { id: "naproxen-500-joint", name: "Naproxen 500mg", dosage: "500mg twice daily after food", otc: true },
      { id: "diclofenac-50", name: "Diclofenac 50mg", dosage: "1 tablet twice daily after food", otc: false },
      { id: "glucosamine-500", name: "Glucosamine 500mg", dosage: "1 tablet 3 times daily with meals", otc: true },
      { id: "volini-gel", name: "Volini / Diclofenac Gel", dosage: "Apply on affected joint 3-4 times daily", otc: true },
    ],
  },

  // ── EYE / ENT ────────────────────────────────────────────────────────────────
  {
    id: "eye-infection",
    name: "Eye Infection / Conjunctivitis",
    category: "Ophthalmology",
    symptoms: ["red eyes", "eye infection", "conjunctivitis", "pink eye", "eye discharge", "watery eyes", "itchy eyes", "eye pain"],
    medicines: [
      { id: "ciprofloxacin-eye-drops", name: "Ciprofloxacin 0.3% Eye Drops", dosage: "1-2 drops in affected eye every 4-6 hours", otc: false },
      { id: "sodium-cromoglicate-drops", name: "Sodium Cromoglicate Eye Drops", dosage: "1-2 drops 4 times daily", otc: true },
      { id: "lubricating-eye-drops", name: "Lubricating Eye Drops (Tears)", dosage: "1-2 drops as needed", otc: true },
    ],
  },
  {
    id: "ear-pain",
    name: "Ear Pain / Ear Infection",
    category: "ENT",
    symptoms: ["ear pain", "earache", "ear infection", "ear discharge", "blocked ear", "ringing in ear", "tinnitus", "ear pressure"],
    medicines: [
      { id: "ciprofloxacin-ear-drops", name: "Ciprofloxacin Ear Drops", dosage: "3-4 drops in affected ear twice daily", otc: false },
      { id: "paracetamol-ear", name: "Paracetamol 500mg", dosage: "500mg every 4-6 hours for pain", otc: true },
      { id: "waxsol-drops", name: "Waxsol Ear Drops", dosage: "Fill ear canal at night for 2 nights (for wax)", otc: true },
    ],
  },
  {
    id: "sore-throat",
    name: "Sore Throat / Tonsillitis",
    category: "ENT",
    symptoms: ["sore throat", "throat pain", "tonsillitis", "swollen tonsils", "difficulty swallowing", "scratchy throat", "throat infection"],
    medicines: [
      { id: "strepsils", name: "Strepsils Lozenges", dosage: "1 lozenge every 2-3 hours (max 8/day)", otc: true },
      { id: "betadine-gargle", name: "Betadine Gargle", dosage: "Gargle with diluted solution 3-4 times daily", otc: true },
      { id: "amoxicillin-500", name: "Amoxicillin 500mg", dosage: "1 capsule 3 times daily for 5-7 days", otc: false },
      { id: "ibuprofen-throat", name: "Ibuprofen 400mg", dosage: "400mg every 6-8 hours to reduce inflammation", otc: true },
    ],
  },

  // ── URINARY ──────────────────────────────────────────────────────────────────
  {
    id: "uti",
    name: "Urinary Tract Infection (UTI)",
    category: "Urology",
    symptoms: ["burning urination", "painful urination", "frequent urination", "uti", "urinary tract infection", "cloudy urine", "blood in urine", "pelvic pain"],
    medicines: [
      { id: "nitrofurantoin-100", name: "Nitrofurantoin 100mg", dosage: "1 tablet twice daily for 5-7 days with food", otc: false },
      { id: "ciprofloxacin-500-uti", name: "Ciprofloxacin 500mg", dosage: "1 tablet twice daily for 3-7 days", otc: false },
      { id: "phenazopyridine", name: "Phenazopyridine 200mg", dosage: "1 tablet 3 times daily after meals (pain relief)", otc: true },
    ],
  },

  // ── MENTAL HEALTH / SLEEP ────────────────────────────────────────────────────
  {
    id: "insomnia",
    name: "Insomnia / Sleep Problems",
    category: "Mental Health",
    symptoms: ["insomnia", "sleeplessness", "can't sleep", "difficulty sleeping", "sleep problems", "waking up at night", "poor sleep", "restless sleep"],
    medicines: [
      { id: "melatonin-3", name: "Melatonin 3mg", dosage: "1 tablet 30 minutes before bedtime", otc: true },
      { id: "diphenhydramine-25", name: "Diphenhydramine 25mg", dosage: "1 tablet at bedtime (short-term only)", otc: true },
      { id: "valerian-root", name: "Valerian Root Extract", dosage: "300-600mg 30 minutes before bed", otc: true },
    ],
  },
  {
    id: "anxiety",
    name: "Anxiety",
    category: "Mental Health",
    symptoms: ["anxiety", "nervousness", "panic attack", "excessive worry", "restlessness", "racing heart anxiety", "sweating anxiety", "fear"],
    medicines: [
      { id: "buspirone-10", name: "Buspirone 10mg", dosage: "1 tablet twice daily (consult doctor)", otc: false },
      { id: "ashwagandha", name: "Ashwagandha Extract 300mg", dosage: "1 capsule twice daily with meals", otc: true },
      { id: "magnesium-glycinate", name: "Magnesium Glycinate 400mg", dosage: "1 tablet daily at night", otc: true },
    ],
  },

  // ── WOMEN'S HEALTH ───────────────────────────────────────────────────────────
  {
    id: "menstrual-cramps",
    name: "Menstrual Cramps",
    category: "Women's Health",
    symptoms: ["menstrual cramps", "period pain", "dysmenorrhea", "painful periods", "lower abdominal cramps during period", "period cramps", "menstruation pain"],
    medicines: [
      { id: "mefenamic-acid-500", name: "Mefenamic Acid 500mg", dosage: "1 tablet 3 times daily after food during periods", otc: true },
      { id: "ibuprofen-period", name: "Ibuprofen 400mg", dosage: "400mg every 6-8 hours after food", otc: true },
      { id: "hot-water-bag", name: "Hot Water Bag", dosage: "Apply on lower abdomen for 15-20 minutes", otc: true },
    ],
  },

  // ── DENTAL ───────────────────────────────────────────────────────────────────
  {
    id: "toothache",
    name: "Toothache",
    category: "Dental",
    symptoms: ["toothache", "tooth pain", "dental pain", "gum pain", "swollen gum", "tooth sensitivity", "jaw pain"],
    medicines: [
      { id: "clove-oil", name: "Clove Oil", dosage: "Apply 1-2 drops on affected tooth/gum with cotton", otc: true },
      { id: "ibuprofen-tooth", name: "Ibuprofen 400mg", dosage: "400mg every 6-8 hours after food", otc: true },
      { id: "amoxicillin-tooth", name: "Amoxicillin 500mg", dosage: "1 capsule 3 times daily for 5 days (if infection)", otc: false },
      { id: "benzocaine-gel", name: "Benzocaine Oral Gel", dosage: "Apply small amount on gum as needed", otc: true },
    ],
  },
];

// Helper: normalize text
const normalize = (text) =>
  (text || "")
    .toString()
    .trim()
    .toLowerCase();

// Scoring: match full symptom phrases (weighted higher) + individual tokens.
// Full-phrase match scores 3x to prevent single common tokens (e.g. "pain")
// from incorrectly matching unrelated diseases.
const scoreDiseaseByQuery = (disease, queryTokens, normalizedQuery) => {
  let score = 0;

  // Full-phrase match (high weight)
  disease.symptoms.forEach((s) => {
    const sym = normalize(s);
    if (normalizedQuery.includes(sym)) {
      score += 3;
    }
  });

  // Token-level match (low weight, only adds if no phrase match already covered it)
  const symptomTokens = new Set(
    disease.symptoms.flatMap((s) => normalize(s).split(/[^a-z0-9]+/).filter(Boolean))
  );
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
      const normalizedQuery = normalize(q);
      const queryTokens = new Set(
        normalizedQuery.split(/[^a-z0-9]+/).filter(Boolean)
      );

      let bestScore = 0;
      let bestDisease = null;
      diseaseDataset.forEach((disease) => {
        const s = scoreDiseaseByQuery(disease, queryTokens, normalizedQuery);
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
