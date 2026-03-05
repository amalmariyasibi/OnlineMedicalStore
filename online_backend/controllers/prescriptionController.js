const { processPrescriptionImage } = require('../services/ocrService');
const PrescriptionCorrection = require('../models/PrescriptionCorrection');
const { initFirebaseAdmin } = require('../config/firebaseAdmin');

// Mock medicines data for testing/demo
const MOCK_MEDICINES = [
  {
    id: 'med1',
    name: 'Tr Bellidopnas Me',
    genericName: 'Belladonna',
    strength: '5me',
    price: 185,
    stockQuantity: 50,
    category: 'Tincture',
    requiresPrescription: true
  },
  {
    id: 'med1b',
    name: 'Belladonna Tincture (Tr Belladonna)',
    genericName: 'Belladonna',
    strength: '5ml',
    price: 185,
    stockQuantity: 50,
    category: 'Tincture',
    requiresPrescription: true
  },
  {
    id: 'med2',
    name: 'Ampteoget Goed',
    genericName: 'Ampteoget',
    strength: '120ml',
    price: 850,
    stockQuantity: 30,
    category: 'Syrup',
    requiresPrescription: false
  },
  {
    id: 'med2b',
    name: 'Ampteoget Good',
    genericName: 'Ampteoget',
    strength: '120ml',
    price: 850,
    stockQuantity: 30,
    category: 'Syrup',
    requiresPrescription: false
  },
  {
    id: 'med3',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    strength: '500mg',
    price: 50,
    stockQuantity: 100,
    category: 'Tablet',
    requiresPrescription: false
  },
  {
    id: 'med4',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    strength: '250mg',
    price: 120,
    stockQuantity: 75,
    category: 'Capsule',
    requiresPrescription: true
  },
  {
    id: 'med5',
    name: 'Cetirizine',
    genericName: 'Cetirizine',
    strength: '10mg',
    price: 80,
    stockQuantity: 60,
    category: 'Tablet',
    requiresPrescription: false
  },
  {
    id: 'med6',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    strength: '400mg',
    price: 60,
    stockQuantity: 90,
    category: 'Tablet',
    requiresPrescription: false
  },
  {
    id: 'med7',
    name: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    strength: '75mg',
    price: 40,
    stockQuantity: 120,
    category: 'Tablet',
    requiresPrescription: false
  },
  {
    id: 'med8',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    strength: '20mg',
    price: 95,
    stockQuantity: 55,
    category: 'Capsule',
    requiresPrescription: true
  }
];

/**
 * Process prescription image with OCR
 */
const processPrescription = async (req, res) => {
  try {
    console.log('Processing prescription request received');
    
    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { userId } = req.body;
    
    if (!userId) {
      console.log('No userId provided in request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`Processing prescription for user: ${userId}, file size: ${req.file.size} bytes`);

    let databaseMedicines = [];
    
    // Try to get medicines from Firebase, but use mock data if it fails
    try {
      const admin = initFirebaseAdmin();
      const db = admin.firestore();
      
      console.log('Firebase Admin initialized, fetching medicines...');
      const medicinesSnapshot = await db.collection('medicines').get();
      
      medicinesSnapshot.forEach(doc => {
        const data = doc.data();
        databaseMedicines.push({
          id: doc.id,
          name: data.name || '',
          genericName: data.genericName || '',
          strength: data.strength || '',
          price: data.price || 0,
          stockQuantity: data.stockQuantity || 0,
          category: data.category || '',
          requiresPrescription: data.requiresPrescription || false,
          ...data
        });
      });
      
      console.log(`Found ${databaseMedicines.length} medicines in Firebase`);
    } catch (firebaseError) {
      console.warn('Firebase error, using mock medicines data:', firebaseError.message);
      databaseMedicines = MOCK_MEDICINES;
      console.log(`Using ${databaseMedicines.length} mock medicines`);
    }

    // If no medicines found, use mock data
    if (databaseMedicines.length === 0) {
      console.log('No medicines in database, using mock data');
      databaseMedicines = MOCK_MEDICINES;
    }

    // Check for previous corrections to improve accuracy
    let corrections = [];
    try {
      corrections = await PrescriptionCorrection.find({ userId }).limit(100);
      console.log(`Found ${corrections.length} previous corrections for user`);
    } catch (mongoError) {
      console.warn('MongoDB error, skipping corrections:', mongoError.message);
    }
    
    // Apply learned corrections to database medicines (boost matching)
    const enhancedMedicines = databaseMedicines.map(med => {
      const correction = corrections.find(c => c.correctedMedicineId === med.id);
      if (correction) {
        return {
          ...med,
          alternateNames: [correction.extractedMedicineName]
        };
      }
      return med;
    });

    console.log('Starting OCR processing...');
    // Process the prescription image
    const result = await processPrescriptionImage(req.file.buffer, enhancedMedicines);
    console.log('OCR processing completed successfully');

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Process prescription error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to process prescription',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Save user correction for learning
 */
const savePrescriptionCorrection = async (req, res) => {
  try {
    const {
      userId,
      prescriptionId,
      extractedText,
      correctedText,
      extractedMedicineName,
      correctedMedicineId,
      correctedMedicineName,
      confidence
    } = req.body;

    if (!userId || !extractedMedicineName || !correctedMedicineId) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Check if correction already exists
    const existingCorrection = await PrescriptionCorrection.findOne({
      userId,
      extractedMedicineName: extractedMedicineName.toLowerCase()
    });

    if (existingCorrection) {
      // Update existing correction
      existingCorrection.correctedMedicineId = correctedMedicineId;
      existingCorrection.correctedMedicineName = correctedMedicineName;
      existingCorrection.correctedText = correctedText || extractedText;
      existingCorrection.confidence = confidence || existingCorrection.confidence;
      await existingCorrection.save();
      
      return res.json({
        success: true,
        message: 'Correction updated',
        data: existingCorrection
      });
    }

    // Create new correction
    const correction = new PrescriptionCorrection({
      userId,
      prescriptionId: prescriptionId || '',
      extractedText: extractedText || extractedMedicineName,
      correctedText: correctedText || correctedMedicineName,
      extractedMedicineName: extractedMedicineName.toLowerCase(),
      correctedMedicineId,
      correctedMedicineName,
      confidence: confidence || 0
    });

    await correction.save();

    res.json({
      success: true,
      message: 'Correction saved for future learning',
      data: correction
    });
  } catch (error) {
    console.error('Save correction error:', error);
    res.status(500).json({
      error: 'Failed to save correction',
      details: error.message
    });
  }
};

/**
 * Get user's correction history
 */
const getUserCorrections = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const corrections = await PrescriptionCorrection.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: corrections
    });
  } catch (error) {
    console.error('Get corrections error:', error);
    res.status(500).json({
      error: 'Failed to get corrections',
      details: error.message
    });
  }
};

module.exports = {
  processPrescription,
  savePrescriptionCorrection,
  getUserCorrections
};
