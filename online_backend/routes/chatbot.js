const express = require('express');
const router = express.Router();

// Comprehensive symptom to medicine mapping database
const symptomMedicineDB = {
  // Pain & Fever
  'headache': [
    { name: 'Paracetamol 500mg', description: 'Effective pain reliever and fever reducer', dosage: '1-2 tablets every 4-6 hours (max 4g/day)', available: true },
    { name: 'Ibuprofen 400mg', description: 'Anti-inflammatory pain reliever', dosage: '1 tablet every 6-8 hours with food', available: true },
    { name: 'Aspirin 325mg', description: 'Pain relief and anti-inflammatory', dosage: '1-2 tablets every 4-6 hours', available: true }
  ],
  'fever': [
    { name: 'Paracetamol 650mg', description: 'Fast-acting fever reducer', dosage: '1 tablet every 4-6 hours', available: true },
    { name: 'Ibuprofen 400mg', description: 'Reduces fever and inflammation', dosage: '1 tablet every 6-8 hours', available: true },
    { name: 'Aspirin 325mg', description: 'Fever reducer (not for children)', dosage: '1-2 tablets every 4 hours', available: true }
  ],
  'body ache': [
    { name: 'Ibuprofen 400mg', description: 'Relieves muscle and body pain', dosage: '1 tablet every 6-8 hours', available: true },
    { name: 'Paracetamol 500mg', description: 'General pain relief', dosage: '1-2 tablets every 4-6 hours', available: true },
    { name: 'Diclofenac Gel', description: 'Topical pain relief', dosage: 'Apply to affected area 3-4 times daily', available: true }
  ],
  'migraine': [
    { name: 'Sumatriptan 50mg', description: 'Migraine-specific medication', dosage: '1 tablet at onset of migraine', available: true },
    { name: 'Paracetamol + Caffeine', description: 'Enhanced pain relief for migraines', dosage: '1-2 tablets as needed', available: true }
  ],
  
  // Respiratory
  'cough': [
    { name: 'Dextromethorphan Syrup', description: 'Effective cough suppressant', dosage: '10ml every 6-8 hours', available: true },
    { name: 'Ambroxol Syrup', description: 'Expectorant for productive cough', dosage: '10ml 3 times daily', available: true },
    { name: 'Honey-Ginger Cough Syrup', description: 'Natural cough relief', dosage: '10ml 3-4 times daily', available: true },
    { name: 'Cough Lozenges', description: 'Soothes throat and reduces cough', dosage: '1 lozenge every 2-3 hours', available: true }
  ],
  'cold': [
    { name: 'Cetirizine 10mg', description: 'Antihistamine for cold symptoms', dosage: '1 tablet once daily at bedtime', available: true },
    { name: 'Phenylephrine + Paracetamol', description: 'Multi-symptom cold relief', dosage: '1 tablet every 6 hours', available: true },
    { name: 'Vitamin C 1000mg', description: 'Immune system support', dosage: '1 tablet daily', available: true },
    { name: 'Zinc Lozenges', description: 'Reduces cold duration', dosage: '1 lozenge every 2-3 hours', available: true }
  ],
  'flu': [
    { name: 'Paracetamol 500mg', description: 'Reduces flu symptoms', dosage: '1-2 tablets every 4-6 hours', available: true },
    { name: 'Oseltamivir 75mg', description: 'Antiviral for influenza', dosage: '1 capsule twice daily for 5 days', available: true },
    { name: 'Multi-vitamin', description: 'Supports recovery', dosage: '1 tablet daily', available: true }
  ],
  'sore throat': [
    { name: 'Strepsils Lozenges', description: 'Antibacterial throat lozenges', dosage: '1 lozenge every 2-3 hours', available: true },
    { name: 'Betadine Gargle', description: 'Antiseptic throat gargle', dosage: 'Gargle 3-4 times daily', available: true },
    { name: 'Ibuprofen 400mg', description: 'Reduces throat inflammation', dosage: '1 tablet every 6-8 hours', available: true },
    { name: 'Throat Spray', description: 'Instant throat relief', dosage: 'Spray 3-4 times as needed', available: true }
  ],
  'nasal congestion': [
    { name: 'Xylometazoline Nasal Spray', description: 'Decongestant nasal spray', dosage: '2 sprays per nostril twice daily', available: true },
    { name: 'Pseudoephedrine 60mg', description: 'Oral decongestant', dosage: '1 tablet every 6 hours', available: true },
    { name: 'Saline Nasal Spray', description: 'Natural nasal relief', dosage: 'Use as needed', available: true }
  ],
  'runny nose': [
    { name: 'Cetirizine 10mg', description: 'Stops runny nose', dosage: '1 tablet once daily', available: true },
    { name: 'Chlorpheniramine 4mg', description: 'Antihistamine for runny nose', dosage: '1 tablet every 4-6 hours', available: true }
  ],
  'sneezing': [
    { name: 'Loratadine 10mg', description: 'Non-drowsy antihistamine', dosage: '1 tablet once daily', available: true },
    { name: 'Cetirizine 10mg', description: 'Stops sneezing and allergies', dosage: '1 tablet once daily', available: true }
  ],
  
  // Digestive
  'stomach ache': [
    { name: 'Antacid Tablets (Digene)', description: 'Quick relief from stomach pain', dosage: '1-2 tablets after meals', available: true },
    { name: 'Omeprazole 20mg', description: 'Reduces stomach acid production', dosage: '1 capsule before breakfast', available: true },
    { name: 'Buscopan 10mg', description: 'Relieves stomach cramps', dosage: '1 tablet 3 times daily', available: true }
  ],
  'acidity': [
    { name: 'Pantoprazole 40mg', description: 'Proton pump inhibitor', dosage: '1 tablet before breakfast', available: true },
    { name: 'Ranitidine 150mg', description: 'H2 blocker for acidity', dosage: '1 tablet twice daily', available: true },
    { name: 'ENO Fruit Salt', description: 'Instant acidity relief', dosage: '1 sachet in water as needed', available: true },
    { name: 'Gelusil Syrup', description: 'Antacid syrup', dosage: '10ml after meals', available: true }
  ],
  'gas': [
    { name: 'Simethicone 125mg', description: 'Anti-gas medication', dosage: '1 tablet after meals', available: true },
    { name: 'Activated Charcoal', description: 'Absorbs gas', dosage: '1-2 capsules as needed', available: true }
  ],
  'bloating': [
    { name: 'Simethicone + Activated Charcoal', description: 'Relieves bloating', dosage: '1 tablet after meals', available: true },
    { name: 'Digestive Enzymes', description: 'Aids digestion', dosage: '1 capsule with meals', available: true }
  ],
  'indigestion': [
    { name: 'Digestive Enzyme Tablets', description: 'Improves digestion', dosage: '1 tablet with meals', available: true },
    { name: 'Antacid Syrup', description: 'Relieves indigestion', dosage: '10ml after meals', available: true }
  ],
  'nausea': [
    { name: 'Ondansetron 4mg', description: 'Anti-nausea medication', dosage: '1 tablet every 8 hours', available: true },
    { name: 'Domperidone 10mg', description: 'Prevents nausea and vomiting', dosage: '1 tablet 3 times daily before meals', available: true },
    { name: 'Ginger Capsules', description: 'Natural nausea relief', dosage: '1-2 capsules as needed', available: true }
  ],
  'vomiting': [
    { name: 'Ondansetron 4mg', description: 'Stops vomiting', dosage: '1 tablet every 8 hours', available: true },
    { name: 'ORS (Oral Rehydration Solution)', description: 'Prevents dehydration', dosage: 'Sip frequently', available: true }
  ],
  'diarrhea': [
    { name: 'Loperamide 2mg', description: 'Anti-diarrheal medication', dosage: '2 tablets initially, then 1 after each loose stool', available: true },
    { name: 'ORS Sachets', description: 'Prevents dehydration', dosage: '1 sachet in 1L water, drink throughout day', available: true },
    { name: 'Probiotic Capsules', description: 'Restores gut bacteria', dosage: '1 capsule twice daily', available: true },
    { name: 'Zinc Sulfate 20mg', description: 'Reduces diarrhea duration', dosage: '1 tablet daily', available: true }
  ],
  'constipation': [
    { name: 'Isabgol (Psyllium Husk)', description: 'Natural fiber supplement', dosage: '1-2 tablespoons with water at bedtime', available: true },
    { name: 'Bisacodyl 5mg', description: 'Gentle laxative', dosage: '1-2 tablets at bedtime', available: true },
    { name: 'Lactulose Syrup', description: 'Osmotic laxative', dosage: '15ml at bedtime', available: true },
    { name: 'Docusate Sodium', description: 'Stool softener', dosage: '1 capsule twice daily', available: true }
  ],
  
  // Allergies
  'allergy': [
    { name: 'Cetirizine 10mg', description: 'Antihistamine for allergies', dosage: '1 tablet once daily', available: true },
    { name: 'Loratadine 10mg', description: 'Non-drowsy allergy relief', dosage: '1 tablet once daily', available: true },
    { name: 'Fexofenadine 120mg', description: 'Long-acting antihistamine', dosage: '1 tablet once daily', available: true },
    { name: 'Montelukast 10mg', description: 'Allergy and asthma relief', dosage: '1 tablet at bedtime', available: true }
  ],
  'itching': [
    { name: 'Cetirizine 10mg', description: 'Stops itching', dosage: '1 tablet once daily', available: true },
    { name: 'Calamine Lotion', description: 'Topical itch relief', dosage: 'Apply to affected area as needed', available: true },
    { name: 'Hydrocortisone Cream 1%', description: 'Anti-itch cream', dosage: 'Apply thin layer twice daily', available: true }
  ],
  'rash': [
    { name: 'Hydrocortisone Cream 1%', description: 'Reduces rash and inflammation', dosage: 'Apply thin layer twice daily', available: true },
    { name: 'Cetirizine 10mg', description: 'Antihistamine for allergic rash', dosage: '1 tablet once daily', available: true },
    { name: 'Calamine Lotion', description: 'Soothes skin rash', dosage: 'Apply as needed', available: true }
  ],
  
  // Sleep & Anxiety
  'insomnia': [
    { name: 'Melatonin 3mg', description: 'Natural sleep aid', dosage: '1 tablet 30 minutes before bedtime', available: true },
    { name: 'Diphenhydramine 25mg', description: 'Sleep aid', dosage: '1-2 tablets at bedtime', available: true }
  ],
  'anxiety': [
    { name: 'Ashwagandha Capsules', description: 'Natural stress relief', dosage: '1 capsule twice daily', available: true },
    { name: 'L-Theanine 200mg', description: 'Promotes relaxation', dosage: '1 capsule as needed', available: true }
  ],
  'stress': [
    { name: 'Ashwagandha 500mg', description: 'Adaptogen for stress', dosage: '1 capsule twice daily', available: true },
    { name: 'B-Complex Vitamins', description: 'Supports nervous system', dosage: '1 tablet daily', available: true }
  ],
  
  // Skin
  'burn': [
    { name: 'Silver Sulfadiazine Cream', description: 'Burn treatment cream', dosage: 'Apply thin layer twice daily', available: true },
    { name: 'Aloe Vera Gel', description: 'Soothes burns', dosage: 'Apply generously as needed', available: true }
  ],
  'wound': [
    { name: 'Povidone-Iodine Solution', description: 'Antiseptic for wounds', dosage: 'Clean wound 2-3 times daily', available: true },
    { name: 'Antibiotic Ointment', description: 'Prevents infection', dosage: 'Apply thin layer twice daily', available: true }
  ],
  'cut': [
    { name: 'Antiseptic Liquid (Dettol)', description: 'Disinfects cuts', dosage: 'Dilute and clean wound', available: true },
    { name: 'Band-Aid/Bandages', description: 'Protects cuts', dosage: 'Apply after cleaning', available: true }
  ],
  
  // Eye & Ear
  'eye irritation': [
    { name: 'Artificial Tears', description: 'Lubricating eye drops', dosage: '1-2 drops as needed', available: true },
    { name: 'Refresh Eye Drops', description: 'Relieves dry eyes', dosage: '1-2 drops 3-4 times daily', available: true }
  ],
  'ear pain': [
    { name: 'Ear Drops (Otex)', description: 'Relieves ear discomfort', dosage: '3-4 drops twice daily', available: true },
    { name: 'Ibuprofen 400mg', description: 'Pain relief', dosage: '1 tablet every 6-8 hours', available: true }
  ],
  
  // Vitamins & Supplements
  'weakness': [
    { name: 'Multivitamin Tablets', description: 'Complete nutrition support', dosage: '1 tablet daily with breakfast', available: true },
    { name: 'Iron + Folic Acid', description: 'Treats anemia and weakness', dosage: '1 tablet daily', available: true },
    { name: 'Vitamin B12 1000mcg', description: 'Energy booster', dosage: '1 tablet daily', available: true }
  ],
  'fatigue': [
    { name: 'B-Complex Vitamins', description: 'Boosts energy', dosage: '1 tablet daily', available: true },
    { name: 'Coenzyme Q10', description: 'Cellular energy support', dosage: '1 capsule daily', available: true },
    { name: 'Ginseng Capsules', description: 'Natural energy booster', dosage: '1 capsule daily', available: true }
  ],
  'vitamin deficiency': [
    { name: 'Multivitamin + Minerals', description: 'Complete vitamin supplement', dosage: '1 tablet daily', available: true },
    { name: 'Vitamin D3 2000 IU', description: 'Bone and immune health', dosage: '1 tablet daily', available: true },
    { name: 'Omega-3 Fish Oil', description: 'Heart and brain health', dosage: '1 capsule daily', available: true }
  ],
  
  // Women's Health
  'menstrual cramps': [
    { name: 'Mefenamic Acid 500mg', description: 'Period pain relief', dosage: '1 tablet 3 times daily with food', available: true },
    { name: 'Ibuprofen 400mg', description: 'Reduces cramps', dosage: '1 tablet every 6-8 hours', available: true },
    { name: 'Heating Pad', description: 'Natural pain relief', dosage: 'Apply to lower abdomen', available: true }
  ],
  'period pain': [
    { name: 'Mefenamic Acid 500mg', description: 'Menstrual pain relief', dosage: '1 tablet 3 times daily', available: true },
    { name: 'Paracetamol 500mg', description: 'Pain relief', dosage: '1-2 tablets every 4-6 hours', available: true }
  ],
  
  // General
  'pain': [
    { name: 'Ibuprofen 400mg', description: 'General pain reliever', dosage: '1 tablet every 6-8 hours', available: true },
    { name: 'Paracetamol 500mg', description: 'Pain relief', dosage: '1-2 tablets every 4-6 hours', available: true },
    { name: 'Diclofenac 50mg', description: 'Strong pain relief', dosage: '1 tablet twice daily with food', available: true }
  ],
  'inflammation': [
    { name: 'Ibuprofen 400mg', description: 'Anti-inflammatory', dosage: '1 tablet every 6-8 hours', available: true },
    { name: 'Diclofenac Gel', description: 'Topical anti-inflammatory', dosage: 'Apply to affected area 3 times daily', available: true }
  ]
};

// Serious symptoms that require immediate medical attention
const seriousSymptoms = [
  'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 
  'seizure', 'severe headache', 'confusion', 'high fever', 'severe abdominal pain',
  'stroke', 'heart attack', 'severe allergic reaction', 'suicide', 'self harm'
];

// Moderate symptoms that should see a doctor soon
const moderateSymptoms = [
  'persistent fever', 'persistent cough', 'blood in stool', 'blood in urine',
  'severe pain', 'vision problems', 'hearing loss', 'unexplained weight loss',
  'persistent vomiting', 'severe diarrhea', 'jaundice', 'swelling'
];

// Analyze symptoms and suggest medicines
router.post('/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const symptomsLower = symptoms.toLowerCase();
    const suggestedMedicines = [];
    const matchedSymptoms = [];

    // Check for symptom matches with partial matching
    for (const [symptom, medicines] of Object.entries(symptomMedicineDB)) {
      // Check if symptom keyword is in the user's input
      if (symptomsLower.includes(symptom) || 
          symptomsLower.includes(symptom.replace(' ', '')) ||
          symptom.split(' ').some(word => symptomsLower.includes(word))) {
        matchedSymptoms.push(symptom);
        suggestedMedicines.push(...medicines);
      }
    }

    // Additional keyword matching for common variations
    const symptomVariations = {
      'head pain': 'headache',
      'head ache': 'headache',
      'temperature': 'fever',
      'high temperature': 'fever',
      'running nose': 'runny nose',
      'blocked nose': 'nasal congestion',
      'stuffy nose': 'nasal congestion',
      'stomach pain': 'stomach ache',
      'tummy ache': 'stomach ache',
      'loose motion': 'diarrhea',
      'loose motions': 'diarrhea',
      'upset stomach': 'diarrhea',
      'throat pain': 'sore throat',
      'scratchy throat': 'sore throat',
      'tired': 'fatigue',
      'exhausted': 'fatigue',
      'sleepless': 'insomnia',
      'cant sleep': 'insomnia',
      'period cramps': 'menstrual cramps',
      'body pain': 'body ache',
      'muscle pain': 'body ache',
      'joint pain': 'pain',
      'back pain': 'pain',
      'chest congestion': 'cough',
      'phlegm': 'cough',
      'mucus': 'cough'
    };

    // Check variations
    for (const [variation, actualSymptom] of Object.entries(symptomVariations)) {
      if (symptomsLower.includes(variation) && !matchedSymptoms.includes(actualSymptom)) {
        if (symptomMedicineDB[actualSymptom]) {
          matchedSymptoms.push(actualSymptom);
          suggestedMedicines.push(...symptomMedicineDB[actualSymptom]);
        }
      }
    }

    // Remove duplicates based on medicine name
    const uniqueMedicines = Array.from(
      new Map(suggestedMedicines.map(med => [med.name, med])).values()
    );

    // Limit to top 6 most relevant medicines
    const topMedicines = uniqueMedicines.slice(0, 6);

    let advice = '';
    if (matchedSymptoms.length > 0) {
      const symptomList = matchedSymptoms.slice(0, 3).join(', ');
      advice = `I understand you're experiencing ${symptomList}. Based on your symptoms, here are some medicines that can help provide relief.\n\nPlease remember to follow the dosage instructions and consult a healthcare professional if your symptoms persist or worsen.`;
      
      // Add specific advice based on symptoms
      if (matchedSymptoms.some(s => ['fever', 'headache', 'body ache'].includes(s))) {
        advice += '\n\n💡 Self-Care Tips:\n• Rest as much as possible\n• Drink plenty of fluids\n• Monitor your temperature';
      }
      if (matchedSymptoms.some(s => ['cough', 'cold', 'sore throat'].includes(s))) {
        advice += '\n\n💡 Self-Care Tips:\n• Drink warm liquids like tea or soup\n• Use a humidifier\n• Avoid cold beverages';
      }
      if (matchedSymptoms.some(s => ['stomach ache', 'acidity', 'nausea'].includes(s))) {
        advice += '\n\n💡 Self-Care Tips:\n• Eat light, bland foods\n• Avoid spicy and oily foods\n• Have smaller, frequent meals';
      }
      if (matchedSymptoms.some(s => ['diarrhea', 'vomiting'].includes(s))) {
        advice += '\n\n💡 Self-Care Tips:\n• Stay hydrated with ORS\n• Follow the BRAT diet (Banana, Rice, Applesauce, Toast)\n• Avoid dairy temporarily';
      }
    } else {
      advice = 'I\'m having trouble identifying specific symptoms from your description. Could you describe what you\'re feeling? For instance, you might say "headache" or "stomach pain" or "cough and fever".';
    }

    // Check if symptoms are serious
    const hasSerious = seriousSymptoms.some(s => symptomsLower.includes(s));
    if (hasSerious) {
      advice = '🚨 URGENT: Your symptoms may require immediate medical attention. Please visit the nearest emergency room or call emergency services immediately. Do not delay seeking professional medical help.';
      return res.json({
        medicines: [],
        advice,
        matchedSymptoms: [],
        requiresDoctor: true,
        urgency: 'emergency'
      });
    }

    res.json({
      medicines: topMedicines,
      advice,
      matchedSymptoms,
      requiresDoctor: false
    });
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({ error: 'Failed to analyze symptoms' });
  }
});

// Analyze if user should see a doctor
router.post('/doctor-analysis', async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const symptomsLower = symptoms.toLowerCase();
    
    // Check for serious symptoms
    const hasSerious = seriousSymptoms.some(s => symptomsLower.includes(s));
    if (hasSerious) {
      return res.json({
        recommendation: 'consult',
        urgency: 'high',
        reason: '🚨 Based on your symptoms, this could be a serious medical condition requiring immediate attention. Please go to the nearest emergency room or call emergency services right away. Don\'t delay - your health and safety are the priority.'
      });
    }

    // Check for moderate symptoms
    const hasModerate = moderateSymptoms.some(s => symptomsLower.includes(s));
    if (hasModerate) {
      return res.json({
        recommendation: 'consult',
        urgency: 'moderate',
        reason: '⚠️ Your symptoms suggest you should see a doctor within the next 24-48 hours. While this isn\'t an emergency, it\'s important to get a professional evaluation to ensure proper treatment and prevent complications.'
      });
    }

    // Check duration indicators
    const hasPersistent = symptomsLower.includes('days') || symptomsLower.includes('weeks') || symptomsLower.includes('persistent');
    if (hasPersistent) {
      return res.json({
        recommendation: 'consult',
        urgency: 'moderate',
        reason: '📅 Since your symptoms have been ongoing, I recommend scheduling a doctor\'s appointment. Persistent symptoms should be evaluated to rule out any underlying conditions and ensure you get the right treatment.'
      });
    }

    // Mild symptoms
    res.json({
      recommendation: 'self-care',
      urgency: 'low',
      reason: '✅ Your symptoms appear mild and can likely be managed at home with over-the-counter medications, rest, and self-care. However, if your symptoms worsen or don\'t improve within 3-5 days, please consult a healthcare professional.'
    });
  } catch (error) {
    console.error('Error analyzing doctor need:', error);
    res.status(500).json({ error: 'Failed to analyze symptoms' });
  }
});

// General health query handler
router.post('/general-query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const queryLower = query.toLowerCase();
    let response = '';

    // Comprehensive keyword-based responses
    if (queryLower.includes('vitamin') || queryLower.includes('supplement')) {
      response = '💊 Vitamins and Supplements:\n\nVitamins and supplements can support your health, but it\'s best to get nutrients from a balanced diet first. Common beneficial supplements include:\n\n• Vitamin D3 - For bone health and immunity\n• Vitamin C - Immune system support\n• B-Complex - Energy and nervous system\n• Omega-3 - Heart and brain health\n• Calcium - Bone strength\n• Iron - Prevents anemia\n• Zinc - Immune function\n\nAlways consult a healthcare provider before starting any supplement regimen, especially if you have existing health conditions or take medications.';
    } else if (queryLower.includes('diet') || queryLower.includes('nutrition') || queryLower.includes('food')) {
      response = '🥗 Healthy Diet & Nutrition:\n\nA balanced diet is key to good health:\n\n• Fruits & Vegetables - 5 servings daily\n• Whole Grains - Brown rice, oats, whole wheat\n• Lean Proteins - Fish, chicken, legumes, eggs\n• Healthy Fats - Nuts, olive oil, avocado\n• Dairy - Milk, yogurt, cheese (or alternatives)\n\nTips:\n• Stay hydrated (8-10 glasses of water daily)\n• Limit processed foods and sugar\n• Eat regular meals\n• Practice portion control\n• Include variety in your diet\n\nFor personalized dietary advice, consult a nutritionist or dietitian.';
    } else if (queryLower.includes('exercise') || queryLower.includes('workout') || queryLower.includes('fitness')) {
      response = '🏃 Exercise & Fitness:\n\nRegular physical activity is crucial for health:\n\n• Aerobic Exercise - 150 minutes/week of moderate activity (brisk walking, cycling) OR 75 minutes/week of vigorous activity (running, swimming)\n• Strength Training - 2 days/week (weights, resistance bands, bodyweight exercises)\n• Flexibility - Daily stretching or yoga\n• Balance - Especially important as you age\n\nBenefits:\n• Improves heart health\n• Strengthens muscles and bones\n• Boosts mood and energy\n• Helps maintain healthy weight\n• Reduces disease risk\n\nAlways start slowly and consult a doctor before beginning a new exercise program, especially if you have health concerns.';
    } else if (queryLower.includes('sleep') || queryLower.includes('insomnia') || queryLower.includes('rest')) {
      response = '😴 Sleep & Rest:\n\nAdults need 7-9 hours of quality sleep per night:\n\nTips for Better Sleep:\n• Maintain consistent sleep schedule\n• Create relaxing bedtime routine\n• Keep bedroom cool, dark, and quiet\n• Avoid screens 1 hour before bed\n• Limit caffeine after 2 PM\n• Avoid heavy meals before bedtime\n• Exercise regularly (but not close to bedtime)\n• Manage stress through relaxation techniques\n\nIf sleep problems persist for more than 2 weeks, consult a healthcare provider. Chronic insomnia may require professional treatment.';
    } else if (queryLower.includes('stress') || queryLower.includes('anxiety') || queryLower.includes('mental health')) {
      response = '🧘 Stress & Mental Health:\n\nManaging stress is vital for overall health:\n\nStress Management Techniques:\n• Deep breathing exercises\n• Meditation or mindfulness\n• Regular physical activity\n• Yoga or tai chi\n• Adequate sleep\n• Healthy diet\n• Social connections\n• Hobbies and leisure activities\n• Time management\n• Setting boundaries\n\nWarning Signs:\n• Persistent sadness or anxiety\n• Changes in sleep or appetite\n• Difficulty concentrating\n• Loss of interest in activities\n• Physical symptoms (headaches, stomach issues)\n\nIf stress becomes overwhelming or you experience symptoms of depression/anxiety, please speak with a mental health professional. Help is available!';
    } else if (queryLower.includes('medicine') || queryLower.includes('medication') || queryLower.includes('drug')) {
      response = '💊 Medication Safety:\n\nImportant medication guidelines:\n\nDo\'s:\n• Take as prescribed by your doctor\n• Read labels and instructions carefully\n• Take with food if recommended\n• Complete full course of antibiotics\n• Store properly (cool, dry place)\n• Check expiration dates\n• Keep a list of all medications\n• Inform doctors of all medicines you take\n\nDon\'ts:\n• Don\'t share medications\n• Don\'t mix with alcohol (unless approved)\n• Don\'t stop suddenly without consulting doctor\n• Don\'t take expired medicines\n• Don\'t exceed recommended dose\n• Don\'t crush or break extended-release tablets\n\nBe aware of:\n• Potential side effects\n• Drug interactions\n• Allergic reactions\n• When to seek medical help\n\nAlways consult your healthcare provider or pharmacist if you have questions about your medications.';
    } else if (queryLower.includes('water') || queryLower.includes('hydration') || queryLower.includes('drink')) {
      response = '💧 Hydration:\n\nProper hydration is essential for health:\n\n• Adults should drink 8-10 glasses (2-3 liters) of water daily\n• More if exercising or in hot weather\n• Urine should be pale yellow\n\nBenefits of Staying Hydrated:\n• Regulates body temperature\n• Aids digestion\n• Flushes toxins\n• Improves skin health\n• Boosts energy\n• Supports organ function\n\nSigns of Dehydration:\n• Dark urine\n• Dry mouth\n• Fatigue\n• Dizziness\n• Headache\n\nBest Sources:\n• Plain water\n• Herbal teas\n• Fresh fruits (watermelon, oranges)\n• Vegetables (cucumber, lettuce)\n\nLimit sugary drinks and excessive caffeine.';
    } else if (queryLower.includes('weight') || queryLower.includes('obesity') || queryLower.includes('lose weight')) {
      response = '⚖️ Weight Management:\n\nHealthy weight management involves:\n\nKey Principles:\n• Balanced diet with calorie control\n• Regular physical activity\n• Adequate sleep (7-9 hours)\n• Stress management\n• Consistent routine\n\nHealthy Weight Loss:\n• Aim for 0.5-1 kg per week\n• Create moderate calorie deficit\n• Focus on whole foods\n• Avoid crash diets\n• Stay hydrated\n• Track progress\n\nExercise:\n• Cardio for calorie burning\n• Strength training for muscle\n• Aim for 300 minutes/week for weight loss\n\nAvoid:\n• Skipping meals\n• Extreme diets\n• Diet pills without medical supervision\n• Unrealistic expectations\n\nConsult a healthcare provider or nutritionist for personalized weight management plans.';
    } else if (queryLower.includes('diabetes') || queryLower.includes('blood sugar')) {
      response = '🩸 Blood Sugar & Diabetes:\n\nManaging blood sugar levels:\n\nHealthy Habits:\n• Eat regular, balanced meals\n• Choose complex carbohydrates\n• Include fiber-rich foods\n• Limit sugar and refined carbs\n• Exercise regularly\n• Maintain healthy weight\n• Monitor blood sugar if diabetic\n• Take medications as prescribed\n\nWarning Signs of High Blood Sugar:\n• Increased thirst\n• Frequent urination\n• Fatigue\n• Blurred vision\n\nWarning Signs of Low Blood Sugar:\n• Shakiness\n• Sweating\n• Confusion\n• Dizziness\n\nIf you have diabetes or suspect blood sugar issues, regular monitoring and medical supervision are essential.';
    } else if (queryLower.includes('blood pressure') || queryLower.includes('hypertension')) {
      response = '❤️ Blood Pressure:\n\nMaintaining healthy blood pressure:\n\nNormal: Less than 120/80 mmHg\nElevated: 120-129/<80 mmHg\nHigh: 130/80 mmHg or higher\n\nLifestyle Changes:\n• Reduce sodium intake\n• Eat potassium-rich foods\n• Exercise regularly\n• Maintain healthy weight\n• Limit alcohol\n• Quit smoking\n• Manage stress\n• Get adequate sleep\n\nDASH Diet:\n• Fruits and vegetables\n• Whole grains\n• Lean proteins\n• Low-fat dairy\n• Nuts and legumes\n• Limited saturated fats\n\nRegular monitoring and medical check-ups are important, especially if you have high blood pressure.';
    } else if (queryLower.includes('cold') || queryLower.includes('flu') || queryLower.includes('common cold')) {
      response = '🤧 Cold & Flu:\n\nCommon cold and flu management:\n\nSymptoms:\n• Cold: Runny nose, sneezing, mild cough\n• Flu: Fever, body aches, fatigue, severe symptoms\n\nHome Care:\n• Rest adequately\n• Stay hydrated\n• Warm liquids (tea, soup)\n• Gargle with salt water\n• Use humidifier\n• OTC medications for symptom relief\n\nPrevention:\n• Wash hands frequently\n• Avoid touching face\n• Stay away from sick people\n• Get flu vaccine annually\n• Boost immunity with healthy diet\n• Adequate sleep\n\nSee a doctor if:\n• Symptoms worsen after 3-5 days\n• High fever persists\n• Difficulty breathing\n• Severe headache\n• Chest pain';
    } else if (queryLower.includes('immunity') || queryLower.includes('immune system')) {
      response = '🛡️ Immune System:\n\nBoosting your immune system:\n\nHealthy Habits:\n• Balanced, nutritious diet\n• Regular exercise\n• Adequate sleep (7-9 hours)\n• Stress management\n• Stay hydrated\n• Maintain healthy weight\n• Don\'t smoke\n• Limit alcohol\n\nImmune-Boosting Foods:\n• Citrus fruits (Vitamin C)\n• Berries\n• Garlic and ginger\n• Turmeric\n• Green leafy vegetables\n• Yogurt (probiotics)\n• Nuts and seeds\n• Green tea\n\nSupplements (consult doctor):\n• Vitamin C\n• Vitamin D\n• Zinc\n• Probiotics\n\nVaccinations:\n• Stay up-to-date with recommended vaccines\n• Annual flu shot\n\nA strong immune system is your best defense against infections!';
    } else if (queryLower.includes('first aid') || queryLower.includes('emergency')) {
      response = '🚑 First Aid Basics:\n\nBasic first aid knowledge:\n\nCommon Situations:\n\n1. Cuts & Wounds:\n• Clean with water\n• Apply antiseptic\n• Cover with bandage\n• Seek medical help for deep cuts\n\n2. Burns:\n• Cool with running water (10-20 min)\n• Don\'t apply ice\n• Cover with clean cloth\n• Don\'t pop blisters\n\n3. Sprains:\n• Rest\n• Ice (20 min)\n• Compression\n• Elevation\n\n4. Nosebleeds:\n• Sit upright, lean forward\n• Pinch nose for 10 minutes\n• Don\'t tilt head back\n\n5. Choking:\n• Heimlich maneuver\n• Call emergency if severe\n\nEmergency Numbers:\n• Keep emergency contacts handy\n• Know location of nearest hospital\n\nFirst Aid Kit:\n• Bandages\n• Antiseptic\n• Pain relievers\n• Thermometer\n• Scissors\n• Gloves';
    } else {
      response = '👋 Hello! I\'m your AI Health Assistant.\n\nI can help you with:\n\n• 💊 Medicine suggestions for symptoms\n• 🏥 Advice on when to see a doctor\n• 🥗 Diet and nutrition information\n• 💪 Exercise and fitness guidance\n• 😴 Sleep and rest tips\n• 🧘 Stress management\n• 💊 Medication safety\n• 🛡️ Immune system boosting\n• And many more health topics!\n\nFeel free to ask me any health-related questions. For specific medical advice, diagnosis, or treatment, please consult a qualified healthcare professional.\n\nWhat would you like to know about?';
    }

    res.json({ response });
  } catch (error) {
    console.error('Error processing general query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

module.exports = router;
