import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const HealthChatbot = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState('general'); // general, symptoms, doctor-advice
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        type: 'bot',
        content: `Hello ${currentUser?.displayName || 'there'}! 👋\n\nI'm your AI Health Assistant. I can help you with medicine recommendations, health advice, and answer your questions.\n\nWhat brings you here today?`,
        timestamp: new Date(),
        options: [
          { label: '💊 Find Medicine for Symptoms', value: 'symptoms' },
          { label: '🏥 Should I See a Doctor?', value: 'doctor-advice' },
          { label: '💬 General Health Query', value: 'general' }
        ]
      }
    ]);
  }, [currentUser]);

  const handleOptionClick = (option) => {
    setChatMode(option.value);
    
    let botResponse = '';
    switch (option.value) {
      case 'symptoms':
        botResponse = 'I\'m ready to help you find the right medicine. Please tell me what symptoms you\'re experiencing.';
        break;
      case 'doctor-advice':
        botResponse = 'I\'ll help you assess whether you should see a doctor. Please describe your symptoms and how long you\'ve had them.';
        break;
      case 'general':
        botResponse = 'I\'m here to answer your health questions. What would you like to know?';
        break;
      default:
        botResponse = 'How can I assist you today?';
    }

    setMessages(prev => [
      ...prev,
      {
        type: 'user',
        content: option.label,
        timestamp: new Date()
      },
      {
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      }
    ]);
  };

  const analyzeSymptomsForMedicine = async (symptoms) => {
    try {
      const response = await axios.post('/api/chatbot/analyze-symptoms', {
        symptoms,
        userId: currentUser?.uid
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      // Fallback to client-side analysis
      return analyzeSymptomsFallback(symptoms);
    }
  };

  const analyzeSymptomsFallback = (symptoms) => {
    const symptomsLower = symptoms.toLowerCase();
    const medicines = [];
    const matchedSymptoms = [];

    // Enhanced Symptom database with comprehensive medicine suggestions
    const symptomDB = {
      'headache': [
        { name: 'Paracetamol 500mg', description: 'Pain reliever and fever reducer', dosage: '1-2 tablets every 4-6 hours', available: true },
        { name: 'Ibuprofen 400mg', description: 'Anti-inflammatory pain reliever', dosage: '1 tablet every 6-8 hours with food', available: true },
        { name: 'Aspirin 75mg', description: 'Pain reliever and blood thinner', dosage: '1 tablet daily', available: true }
      ],
      'fever': [
        { name: 'Paracetamol 500mg', description: 'Fever reducer and pain reliever', dosage: '1-2 tablets every 4-6 hours', available: true },
        { name: 'Ibuprofen 400mg', description: 'Anti-inflammatory and fever reducer', dosage: '1 tablet every 8 hours', available: true },
        { name: 'Dolo 650mg', description: 'Strong fever reducer', dosage: '1 tablet every 6 hours', available: true }
      ],
      'cough': [
        { name: 'Dextromethorphan Syrup', description: 'Cough suppressant', dosage: '10ml every 6-8 hours', available: true },
        { name: 'Ambroxol Syrup', description: 'Expectorant - helps clear mucus', dosage: '10ml 3 times daily', available: true },
        { name: 'Honey-based Cough Syrup', description: 'Natural cough relief', dosage: '10ml 3 times daily', available: true },
        { name: 'Vicks Vaporub', description: 'Topical cough relief', dosage: 'Apply on chest 2-3 times daily', available: true }
      ],
      'cold': [
        { name: 'Cetirizine 10mg', description: 'Antihistamine for cold symptoms', dosage: '1 tablet once daily at bedtime', available: true },
        { name: 'Chlorpheniramine 4mg', description: 'Relieves runny nose and sneezing', dosage: '1 tablet every 4-6 hours', available: true },
        { name: 'Vitamin C 500mg', description: 'Immune system support', dosage: '1 tablet daily', available: true },
        { name: 'Zinc Tablets', description: 'Boosts immunity', dosage: '1 tablet daily', available: true }
      ],
      'sore throat': [
        { name: 'Throat Lozenges (Strepsils)', description: 'Soothes throat irritation', dosage: '1 lozenge every 2-3 hours', available: true },
        { name: 'Betadine Gargle', description: 'Antiseptic throat gargle', dosage: 'Gargle 3-4 times daily', available: true },
        { name: 'Hexidine Mouthwash', description: 'Antibacterial mouth and throat rinse', dosage: 'Rinse twice daily', available: true },
        { name: 'Warm Salt Water', description: 'Natural throat soother', dosage: 'Gargle 3-4 times daily', available: true }
      ],
      'stomach pain': [
        { name: 'Antacid Tablets (Digene)', description: 'Relieves stomach acidity and gas', dosage: '1-2 tablets after meals', available: true },
        { name: 'Omeprazole 20mg', description: 'Reduces stomach acid', dosage: '1 capsule before breakfast', available: true },
        { name: 'Pantoprazole 40mg', description: 'Long-lasting acid reducer', dosage: '1 tablet before breakfast', available: true },
        { name: 'Gas-X (Simethicone)', description: 'Relieves gas and bloating', dosage: '1 tablet after meals', available: true }
      ],
      'diarrhea': [
        { name: 'Loperamide 2mg', description: 'Anti-diarrheal medication', dosage: '2 tablets initially, then 1 after each loose stool', available: true },
        { name: 'ORS (Oral Rehydration Solution)', description: 'Prevents dehydration', dosage: 'Drink as needed', available: true },
        { name: 'Probiotic Capsules', description: 'Restores good gut bacteria', dosage: '1 capsule twice daily', available: true },
        { name: 'Bismuth Subsalicylate', description: 'Treats diarrhea and upset stomach', dosage: '1 tablet every 30 minutes as needed', available: true }
      ],
      'nausea': [
        { name: 'Ondansetron 4mg', description: 'Anti-nausea medication', dosage: '1 tablet every 8 hours', available: true },
        { name: 'Domperidone 10mg', description: 'Relieves nausea and vomiting', dosage: '1 tablet 3 times daily', available: true },
        { name: 'Ginger Capsules', description: 'Natural nausea relief', dosage: '1-2 capsules as needed', available: true },
        { name: 'Peppermint Tea', description: 'Natural digestive aid', dosage: '1 cup as needed', available: true }
      ],
      'allergy': [
        { name: 'Cetirizine 10mg', description: 'Antihistamine for allergies', dosage: '1 tablet once daily', available: true },
        { name: 'Loratadine 10mg', description: 'Non-drowsy allergy relief', dosage: '1 tablet once daily', available: true },
        { name: 'Fexofenadine 120mg', description: 'Long-lasting allergy relief', dosage: '1 tablet once daily', available: true },
        { name: 'Diphenhydramine 25mg', description: 'For severe allergic reactions', dosage: '1 tablet every 4-6 hours', available: true }
      ],
      'pain': [
        { name: 'Ibuprofen 400mg', description: 'Pain reliever and anti-inflammatory', dosage: '1 tablet every 6-8 hours', available: true },
        { name: 'Paracetamol 500mg', description: 'Pain reliever and fever reducer', dosage: '1-2 tablets every 4-6 hours', available: true },
        { name: 'Diclofenac Gel', description: 'Topical pain relief', dosage: 'Apply to affected area 3-4 times daily', available: true },
        { name: 'Volini Spray', description: 'Quick-relief pain spray', dosage: 'Spray on affected area 2-3 times daily', available: true }
      ],
      'acidity': [
        { name: 'Ranitidine 150mg', description: 'Reduces stomach acid', dosage: '1 tablet twice daily', available: true },
        { name: 'Antacid Syrup (Digene)', description: 'Quick relief from acidity', dosage: '10ml after meals', available: true },
        { name: 'Eno Fruit Salt', description: 'Instant relief from acidity', dosage: '1 sachet in water as needed', available: true },
        { name: 'Pantoprazole 40mg', description: 'Long-term acid control', dosage: '1 tablet before breakfast', available: true }
      ],
      'constipation': [
        { name: 'Isabgol Husk', description: 'Natural fiber laxative', dosage: '2 tablespoons with water at bedtime', available: true },
        { name: 'Lactulose Syrup', description: 'Osmotic laxative', dosage: '15ml twice daily', available: true },
        { name: 'Bisacodyl 5mg', description: 'Stimulant laxative', dosage: '1-2 tablets at bedtime', available: true },
        { name: 'Triphala Tablets', description: 'Ayurvedic digestive aid', dosage: '2 tablets at bedtime', available: true }
      ],
      'vomiting': [
        { name: 'Ondansetron 4mg', description: 'Prevents nausea and vomiting', dosage: '1 tablet every 8 hours', available: true },
        { name: 'Domperidone 10mg', description: 'Controls vomiting', dosage: '1 tablet 3 times daily', available: true },
        { name: 'Electral Powder', description: 'Replenishes electrolytes', dosage: 'Mix with water and sip slowly', available: true },
        { name: 'Ginger Tea', description: 'Natural anti-nausea remedy', dosage: '1 cup slowly', available: true }
      ],
      'body pain': [
        { name: 'Paracetamol 500mg', description: 'General pain reliever', dosage: '1-2 tablets every 4-6 hours', available: true },
        { name: 'Ibuprofen 400mg', description: 'Anti-inflammatory for muscle pain', dosage: '1 tablet every 8 hours', available: true },
        { name: 'Moov Oil', description: 'Topical pain relief oil', dosage: 'Apply and massage gently 2-3 times daily', available: true },
        { name: 'Volini Gel', description: 'Pain relief gel', dosage: 'Apply to affected area 3-4 times daily', available: true }
      ],
      'eye infection': [
        { name: 'Moxifloxacin Eye Drops', description: 'Antibiotic for eye infections', dosage: '1 drop 3 times daily', available: true },
        { name: 'Artificial Tears', description: 'Relieves dry and irritated eyes', dosage: '1-2 drops as needed', available: true },
        { name: 'Ketorolac Eye Drops', description: 'Reduces eye inflammation', dosage: '1 drop 4 times daily', available: true }
      ],
      'skin rash': [
        { name: 'Hydrocortisone Cream 1%', description: 'Reduces itching and inflammation', dosage: 'Apply thin layer 2-3 times daily', available: true },
        { name: 'Calamine Lotion', description: 'Soothes skin irritation', dosage: 'Apply as needed', available: true },
        { name: 'Cetirizine 10mg', description: 'Oral antihistamine for rashes', dosage: '1 tablet once daily', available: true },
        { name: 'Aloe Vera Gel', description: 'Natural skin soother', dosage: 'Apply 2-3 times daily', available: true }
      ],
      'acne': [
        { name: 'Benzoyl Peroxide Gel 2.5%', description: 'Kills acne-causing bacteria', dosage: 'Apply thin layer once daily', available: true },
        { name: 'Adapalene Gel', description: 'Unclogs pores', dosage: 'Apply at bedtime', available: true },
        { name: 'Salicylic Acid Face Wash', description: 'Cleans pores and reduces oil', dosage: 'Use twice daily', available: true },
        { name: 'Clindamycin Gel', description: 'Antibiotic for acne', dosage: 'Apply twice daily', available: true }
      ],
      'dandruff': [
        { name: 'Ketoconazole Shampoo 2%', description: 'Anti-fungal dandruff treatment', dosage: 'Use 2-3 times weekly', available: true },
        { name: 'Selenium Sulfide Shampoo', description: 'Reduces flaking and itching', dosage: 'Use twice weekly', available: true },
        { name: 'Tea Tree Oil', description: 'Natural anti-fungal', dosage: 'Mix with shampoo', available: true },
        { name: 'Coconut Oil + Lemon', description: 'Natural dandruff remedy', dosage: 'Apply before washing', available: true }
      ]
    };

    // Check for matches - Enhanced with fuzzy matching and common misspellings
    const symptomAliases = {
      'cough': ['cough', 'couph', 'cof', 'coking', 'cought'],
      'fever': ['fever', 'fevar', 'tempreature', 'high temperature', 'hot'],
      'headache': ['headache', 'head ache', 'head pain', 'migraine', 'cephalgia'],
      'cold': ['cold', 'common cold', 'runny nose', 'sneezing', 'congestion', 'blocked nose'],
      'sore throat': ['sore throat', 'throat pain', 'throat irritation', 'painful swallowing', 'scratchy throat'],
      'stomach pain': ['stomach pain', 'stomach ache', 'abdominal pain', 'tummy pain', 'gastric pain', 'belly pain'],
      'diarrhea': ['diarrhea', 'loose motions', 'diarrohea', 'loose stool', 'frequent stools'],
      'nausea': ['nausea', 'feeling like vomiting', 'queasy', 'wanting to vomit'],
      'vomiting': ['vomiting', 'throwing up', 'puking', 'vomit', 'emesis'],
      'allergy': ['allergy', 'allergic reaction', 'itching', 'hives', 'rashes'],
      'pain': ['pain', 'ache', 'hurt', 'discomfort', 'soreness'],
      'acidity': ['acidity', 'acid reflux', 'heartburn', 'gerd', 'gas problem'],
      'constipation': ['constipation', 'hard stools', 'difficulty passing stools', 'irregular bowel'],
      'body pain': ['body pain', 'body ache', 'muscle pain', 'joint pain', 'aches all over'],
      'eye infection': ['eye infection', 'red eyes', 'pink eye', 'eye discharge', 'conjunctivitis'],
      'skin rash': ['skin rash', 'skin irritation', 'itchy skin', 'red patches', 'hives'],
      'acne': ['acne', 'pimples', 'zits', 'breakouts', 'pimple marks'],
      'dandruff': ['dandruff', 'flaky scalp', 'itchy scalp', 'dry scalp']
    };
    
    for (const [symptomKey, variations] of Object.entries(symptomAliases)) {
      const hasMatch = variations.some(variation => symptomsLower.includes(variation));
      if (hasMatch && symptomDB[symptomKey]) {
        matchedSymptoms.push(symptomKey);
        medicines.push(...symptomDB[symptomKey]);
      }
    }

    // Remove duplicates
    const uniqueMedicines = Array.from(
      new Map(medicines.map(med => [med.name, med])).values()
    );

    let advice = '';
    
    if (matchedSymptoms.length > 0) {
      // Check if symptoms require doctor consultation
      const seriousIndicators = [
        'chest pain', 'difficulty breathing', 'severe bleeding', 'high fever',
        'unconscious', 'seizure', 'confusion', 'stroke symptoms'
      ];
      
      const hasSerious = seriousIndicators.some(s => symptomsLower.includes(s));
      
      const persistentIndicators = [
        'days', 'weeks', 'persistent', 'chronic', 'recurring', 'constant'
      ];
      
      const isPersistent = persistentIndicators.some(s => symptomsLower.includes(s));
      
      if (hasSerious) {
        advice = `⚠️ **IMPORTANT: Based on your symptoms (${matchedSymptoms.join(', ')}), you should consult a doctor immediately.** These may indicate a serious condition requiring medical evaluation.
        
In the meantime, here are some over-the-counter medicines that may provide temporary relief:`;
      } else if (isPersistent) {
        advice = `🩺 **RECOMMENDATION: Since your symptoms have been persistent, it's advisable to consult a doctor** to rule out underlying conditions and get proper treatment.
        
Here are some over-the-counter medicines that may help in the meantime:`;
      } else {
        advice = `💊 **Based on your symptoms (${matchedSymptoms.join(', ')}), here are some over-the-counter medicines that may help:**`;
      }
    } else {
      advice = 'I couldn\'t identify specific symptoms from your description. Please describe your symptoms more clearly (e.g., "I have cough", "headache", "fever", "cold"), or consider consulting a healthcare professional for proper diagnosis.';
    }

    // Check for serious symptoms
    const seriousSymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'seizure'];
    const hasSerious = seriousSymptoms.some(s => symptomsLower.includes(s));
    if (hasSerious) {
      advice = '⚠️ **URGENT: Your symptoms may require immediate medical attention. Please visit the nearest emergency room or call emergency services immediately.**';
    }

    return {
      medicines: uniqueMedicines,
      advice,
      matchedSymptoms,
      requiresDoctor: hasSerious
    };
  };

  const analyzeDoctorNeed = async (symptoms) => {
    try {
      const response = await axios.post('/api/chatbot/doctor-analysis', {
        symptoms,
        userId: currentUser?.uid
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing doctor need:', error);
      // Fallback to client-side analysis
      return analyzeDoctorNeedFallback(symptoms);
    }
  };

  const analyzeDoctorNeedFallback = (symptoms) => {
    const symptomsLower = symptoms.toLowerCase();
    
    // Serious symptoms
    const seriousSymptoms = [
      'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 
      'seizure', 'severe headache', 'confusion', 'stroke', 'heart attack'
    ];
    
    // Moderate symptoms
    const moderateSymptoms = [
      'persistent fever', 'persistent cough', 'blood in stool', 'blood in urine',
      'severe pain', 'vision problems', 'hearing loss', 'unexplained weight loss',
      'persistent vomiting', 'severe diarrhea'
    ];

    // Check for serious symptoms
    const hasSerious = seriousSymptoms.some(s => symptomsLower.includes(s));
    if (hasSerious) {
      return {
        recommendation: 'consult',
        urgency: 'high',
        reason: '🚨 Your symptoms indicate a potentially serious condition that requires immediate medical attention. Please visit the nearest emergency room or call emergency services right away.'
      };
    }

    // Check for moderate symptoms
    const hasModerate = moderateSymptoms.some(s => symptomsLower.includes(s));
    if (hasModerate) {
      return {
        recommendation: 'consult',
        urgency: 'moderate',
        reason: '⚠️ Your symptoms suggest you should schedule an appointment with a doctor within the next 24-48 hours. While not immediately life-threatening, these symptoms should be evaluated by a healthcare professional.'
      };
    }

    // Check duration indicators
    const hasPersistent = symptomsLower.includes('days') || symptomsLower.includes('weeks') || symptomsLower.includes('persistent');
    if (hasPersistent) {
      return {
        recommendation: 'consult',
        urgency: 'moderate',
        reason: '📅 Since your symptoms have been persistent, it\'s advisable to consult a doctor to rule out any underlying conditions and get proper treatment.'
      };
    }

    // Mild symptoms
    return {
      recommendation: 'self-care',
      urgency: 'low',
      reason: '✅ Your symptoms appear to be mild and can likely be managed at home with over-the-counter medications and rest. However, if symptoms worsen or persist for more than 3-5 days, please consult a healthcare professional.'
    };
  };

  const handleGeneralQueryFallback = (query) => {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('vitamin') || queryLower.includes('supplement')) {
      return 'Vitamins and supplements can support your health, but it\'s best to get nutrients from a balanced diet. Common supplements include Vitamin D, Vitamin C, B-Complex, and Omega-3. Consult a healthcare provider before starting any supplement regimen.';
    } else if (queryLower.includes('diet') || queryLower.includes('nutrition') || queryLower.includes('food')) {
      return 'A balanced diet includes fruits, vegetables, whole grains, lean proteins, and healthy fats. Stay hydrated, limit processed foods, and maintain portion control. For personalized dietary advice, consult a nutritionist.';
    } else if (queryLower.includes('exercise') || queryLower.includes('workout') || queryLower.includes('fitness')) {
      return 'Regular exercise is crucial for health. Aim for at least 150 minutes of moderate aerobic activity or 75 minutes of vigorous activity per week, plus strength training twice a week. Always consult a doctor before starting a new exercise program.';
    } else if (queryLower.includes('sleep') || queryLower.includes('insomnia') || queryLower.includes('tired')) {
      return 'Adults need 7-9 hours of sleep per night. Maintain a consistent sleep schedule, create a relaxing bedtime routine, avoid screens before bed, and keep your bedroom cool and dark. If sleep problems persist, consult a healthcare provider.';
    } else if (queryLower.includes('stress') || queryLower.includes('anxiety') || queryLower.includes('worried')) {
      return 'Managing stress is important for overall health. Try relaxation techniques like deep breathing, meditation, yoga, or regular exercise. Maintain social connections and consider speaking with a mental health professional if stress becomes overwhelming.';
    } else if (queryLower.includes('medicine') || queryLower.includes('medication') || queryLower.includes('drug')) {
      return 'Always take medications as prescribed by your doctor. Don\'t share medications, check expiration dates, and be aware of potential side effects. Store medicines properly and keep them out of reach of children.';
    } else if (queryLower.includes('water') || queryLower.includes('hydration')) {
      return 'Staying hydrated is essential for health. Aim for 8-10 glasses of water daily, more if you\'re active or in hot weather. Water helps regulate body temperature, transport nutrients, and remove waste.';
    } else if (queryLower.includes('weight') || queryLower.includes('lose') || queryLower.includes('gain')) {
      return 'Healthy weight management involves a balanced diet and regular exercise. Aim for gradual changes rather than quick fixes. Consult a healthcare provider or nutritionist for personalized weight management advice.';
    } else {
      return 'I\'m here to help with general health information. For specific medical advice, diagnosis, or treatment, please consult a qualified healthcare professional. You can ask me about vitamins, diet, exercise, sleep, stress management, or general wellness topics.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let botResponse;
      const messageLower = inputMessage.toLowerCase();
      
      // Intelligent Intent Detection - Auto-detect what the user is asking
      
      // 1. Check for "Should I consult a doctor?" type questions
      const consultPatterns = [
        'should i consult', 'should i see a doctor', 'do i need a doctor',
        'should i go to hospital', 'need medical attention', 'see a physician',
        'consult a doctor', 'visit doctor', 'medical help', 'doctor appointment'
      ];
      
      const isConsultQuestion = consultPatterns.some(pattern => 
        messageLower.includes(pattern) || 
        messageLower.includes('doctor') || 
        messageLower.includes('hospital') ||
        messageLower.includes('physician')
      );
      
      // 2. Check for medicine/medication questions
      const medicinePatterns = [
        'what medicine', 'which medicine', 'medicine for', 'medication for',
        'tablet for', 'drug for', 'take for', 'prescription', 'over the counter'
      ];
      
      const isMedicineQuestion = medicinePatterns.some(pattern =>
        messageLower.includes(pattern) ||
        (messageLower.includes('medicine') && (messageLower.includes('take') || messageLower.includes('use')))
      );
      
      // 3. Check for symptom description (contains body parts or common symptoms)
      const symptomKeywords = [
        'pain', 'ache', 'hurt', 'feeling', 'symptom', 'suffering', 'have ',
        'headache', 'fever', 'cough', 'cold', 'throat', 'stomach', 'nausea',
        'vomiting', 'diarrhea', 'tired', 'weak', 'dizzy', 'swelling', 'rash'
      ];
      
      const isSymptomDescription = symptomKeywords.some(keyword =>
        messageLower.includes(keyword)
      );
      
      // Smart Response Logic based on detected intent
      
      if (isConsultQuestion && isSymptomDescription) {
        // User is asking about consulting doctor AND describing symptoms
        console.log('🤖 Detected: Doctor consultation question with symptoms');
        const analysis = await analyzeDoctorNeed(inputMessage);
        
        let urgencyColor = 'yellow';
        let urgencyText = 'Moderate';
        
        if (analysis.urgency === 'high') {
          urgencyColor = 'red';
          urgencyText = 'High - Please seek immediate medical attention';
        } else if (analysis.urgency === 'low') {
          urgencyColor = 'green';
          urgencyText = 'Low - You can likely manage this at home';
        }

        botResponse = {
          type: 'bot',
          content: analysis.reason,
          timestamp: new Date(),
          recommendation: analysis.recommendation,
          urgency: {
            level: analysis.urgency,
            color: urgencyColor,
            text: urgencyText
          },
          disclaimer: true
        };
      } else if (isMedicineQuestion || (isSymptomDescription && messageLower.includes('medicine'))) {
        // User is asking about medicines
        console.log('🤖 Detected: Medicine question');
        const analysis = await analyzeSymptomsForMedicine(inputMessage);
        
        botResponse = {
          type: 'bot',
          content: analysis.advice || 'Based on your symptoms, here are some suggestions:',
          timestamp: new Date(),
          medicines: analysis.medicines || [],
          disclaimer: true
        };
      } else if (isSymptomDescription) {
        // User is describing symptoms - provide medicine suggestions
        console.log('🤖 Detected: Symptom description');
        const analysis = await analyzeSymptomsForMedicine(inputMessage);
        
        botResponse = {
          type: 'bot',
          content: analysis.advice || 'Based on your symptoms, here are some suggestions:',
          timestamp: new Date(),
          medicines: analysis.medicines || [],
          disclaimer: true
        };
      } else if (isConsultQuestion) {
        // General question about consulting doctor without specific symptoms
        console.log('🤖 Detected: General doctor consultation question');
        botResponse = {
          type: 'bot',
          content: `That's a great question! To give you the best advice about whether you should consult a doctor, could you tell me more about what you're experiencing? 

For example, you could share:
• What symptoms are you having? (e.g., fever, pain, cough)
• How long have you had these symptoms?
• How severe are they?

This will help me assess whether you need medical attention. 🩺`,
          timestamp: new Date(),
          disclaimer: true
        };
      } else {
        // General health query
        console.log('🤖 Detected: General health query');
        try {
          const response = await axios.post('/api/chatbot/general-query', {
            query: inputMessage,
            userId: currentUser?.uid
          });

          botResponse = {
            type: 'bot',
            content: response.data.response || 'I\'m here to help with your health questions.',
            timestamp: new Date(),
            disclaimer: true
          };
        } catch (error) {
          // Fallback to client-side general query
          const queryResponse = handleGeneralQueryFallback(inputMessage);
          botResponse = {
            type: 'bot',
            content: queryResponse,
            timestamp: new Date(),
            disclaimer: true
          };
        }
      }

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Provide helpful error message
      let errorMessage = 'I apologize for the inconvenience. ';
      
      if (chatMode === 'symptoms') {
        errorMessage += 'Let me try to help you with your symptoms. Please describe them clearly (e.g., "headache", "fever", "cough") and I\'ll suggest some medicines.';
      } else if (chatMode === 'doctor-advice') {
        errorMessage += 'I can still help assess if you should see a doctor. Please describe your symptoms and how long you\'ve had them.';
      } else {
        errorMessage += 'I can still answer general health questions. Try asking about vitamins, diet, exercise, or sleep.';
      }
      
      setMessages(prev => [
        ...prev,
        {
          type: 'bot',
          content: errorMessage,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetChat = () => {
    setChatMode('general');
    setMessages([
      {
        type: 'bot',
        content: `Hello again! 👋\n\nI'm ready to help you with your health concerns.\n\nWhat would you like assistance with?`,
        timestamp: new Date(),
        options: [
          { label: '💊 Find Medicine for Symptoms', value: 'symptoms' },
          { label: '🏥 Should I See a Doctor?', value: 'doctor-advice' },
          { label: '💬 General Health Query', value: 'general' }
        ]
      }
    ]);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🤖 AI Health Assistant</h1>
              <p className="text-sm text-blue-100">
                {chatMode === 'symptoms' && '💊 Symptom Analysis Mode'}
                {chatMode === 'doctor-advice' && '🏥 Doctor Consultation Advisor'}
                {chatMode === 'general' && '💬 General Health Assistant'}
              </p>
            </div>
            <button
              onClick={resetChat}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition duration-200 text-sm font-medium"
            >
              New Chat
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg p-4 shadow`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Medicine Suggestions */}
                  {message.medicines && message.medicines.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="font-semibold text-sm border-b pb-2">💊 Suggested Medicines:</p>
                      {message.medicines.map((med, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-blue-600 text-base">{med.name}</p>
                              <p className="text-sm text-gray-700 mt-1">{med.description}</p>
                              <div className="mt-2 flex items-center text-xs text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">Dosage:</span> <span className="ml-1">{med.dosage}</span>
                              </div>
                            </div>
                            {med.available && (
                              <button className="ml-3 bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition whitespace-nowrap">
                                View in Store
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Doctor Recommendation */}
                  {message.recommendation && (
                    <div className="mt-4">
                      <div className={`p-3 rounded border-l-4 ${
                        message.urgency.color === 'red' ? 'bg-red-50 border-red-500' :
                        message.urgency.color === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-green-50 border-green-500'
                      }`}>
                        <p className="font-semibold text-sm">Urgency Level: {message.urgency.text}</p>
                        <p className="text-sm mt-1">
                          {message.recommendation === 'consult' ? '🏥 We recommend consulting a doctor' : '✅ You may manage this at home'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  {message.options && (
                    <div className="mt-4 space-y-2">
                      {message.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(option)}
                          className="w-full bg-white text-blue-600 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition duration-200 text-left"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Disclaimer */}
                  {message.disclaimer && (
                    <p className="text-xs text-gray-500 mt-3 italic">
                      ⚠️ This is AI-generated advice. Always consult a healthcare professional for medical decisions.
                    </p>
                  )}

                  <p className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 shadow">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="2"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthChatbot;
