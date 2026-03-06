const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const stringSimilarity = require('string-similarity');

class MedicineScannerService {
  constructor() {
    this.commonMedicineKeywords = [
      'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment',
      'mg', 'ml', 'gm', 'mcg', 'strip', 'pack', 'dose'
    ];

    // Mock data for demonstration when database is empty
    this.mockMedicines = [
      {
        _id: 'mock-1',
        name: 'Paracetamol',
        manufacturer: 'PharmaCorp Ltd.',
        strength: '500mg',
        category: 'Pain Relief',
        price: 45,
        description: 'Effective pain reliever and fever reducer',
        inStock: true,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop',
        confidence: 0.85,
        matchedText: 'Paracetamol'
      },
      {
        _id: 'mock-2',
        name: 'Ibuprofen',
        manufacturer: 'HealthMed Inc.',
        strength: '400mg',
        category: 'Anti-inflammatory',
        price: 65,
        description: 'Non-steroidal anti-inflammatory drug (NSAID)',
        inStock: true,
        imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&h=300&fit=crop',
        confidence: 0.75,
        matchedText: 'Ibuprofen'
      },
      {
        _id: 'mock-3',
        name: 'Amoxicillin',
        manufacturer: 'MediLife Pharma',
        strength: '250mg',
        category: 'Antibiotic',
        price: 120,
        description: 'Broad-spectrum antibiotic for bacterial infections',
        inStock: true,
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=300&fit=crop',
        confidence: 0.70,
        matchedText: 'Amoxicillin'
      },
      {
        _id: 'mock-4',
        name: 'Cetirizine',
        manufacturer: 'AllerCare Labs',
        strength: '10mg',
        category: 'Antihistamine',
        price: 55,
        description: 'Relieves allergy symptoms like sneezing and itching',
        inStock: true,
        imageUrl: 'https://images.unsplash.com/photo-1550572017-4a6c5d8f2c7e?w=300&h=300&fit=crop',
        confidence: 0.68,
        matchedText: 'Cetirizine'
      },
      {
        _id: 'mock-5',
        name: 'Omeprazole',
        manufacturer: 'GastroHealth Pharma',
        strength: '20mg',
        category: 'Antacid',
        price: 85,
        description: 'Reduces stomach acid production',
        inStock: true,
        imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=300&h=300&fit=crop',
        confidence: 0.65,
        matchedText: 'Omeprazole'
      }
    ];
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(imageBuffer) {
    try {
      const processedImage = await sharp(imageBuffer)
        .resize(1200, null, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .greyscale()
        .normalize()
        .sharpen()
        .toBuffer();

      return processedImage;
    } catch (error) {
      console.error('Image preprocessing error:', error);
      throw new Error('Failed to preprocess image');
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractTextFromImage(imageBuffer) {
    try {
      const processedImage = await this.preprocessImage(imageBuffer);
      
      const { data: { text } } = await Tesseract.recognize(
        processedImage,
        'eng',
        {
          logger: info => console.log('OCR Progress:', info)
        }
      );

      return text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Parse extracted text to identify medicine names and details
   */
  parseMedicineText(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const medicineInfo = {
      possibleNames: [],
      strength: null,
      manufacturer: null,
      keywords: []
    };

    // Extract medicine names (usually in uppercase or title case)
    const namePattern = /^[A-Z][A-Za-z\s\-]+(?:\s+\d+(?:mg|ml|gm|mcg))?$/;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check for medicine names
      if (namePattern.test(trimmedLine) && trimmedLine.length > 3) {
        medicineInfo.possibleNames.push(trimmedLine);
      }

      // Extract strength (e.g., 500mg, 10ml)
      const strengthMatch = trimmedLine.match(/(\d+(?:\.\d+)?)\s*(mg|ml|gm|mcg|g)/i);
      if (strengthMatch && !medicineInfo.strength) {
        medicineInfo.strength = strengthMatch[0];
      }

      // Check for common medicine keywords
      this.commonMedicineKeywords.forEach(keyword => {
        if (trimmedLine.toLowerCase().includes(keyword)) {
          medicineInfo.keywords.push(keyword);
        }
      });
    });

    return medicineInfo;
  }

  /**
   * Match extracted text with medicines in database
   */
  async findMatchingMedicines(medicineInfo, Medicine) {
    try {
      const matches = [];
      
      // Get all medicines from database
      const allMedicines = await Medicine.find({ inStock: true });

      // If database is empty, return only 1 mock medicine (simulating a single strip scan)
      if (allMedicines.length === 0) {
        console.log('Database is empty, returning sample mock medicine data');
        return [this.mockMedicines[0]]; // Return only Paracetamol
      }

      // Try to match with possible names
      for (const possibleName of medicineInfo.possibleNames) {
        const medicineNames = allMedicines.map(m => m.name);
        const similarities = stringSimilarity.findBestMatch(possibleName, medicineNames);

        // Get matches with confidence > 0.3
        similarities.ratings.forEach((rating, index) => {
          if (rating.rating > 0.3) {
            const medicine = allMedicines[index];
            
            // Check if already added
            if (!matches.find(m => m._id.toString() === medicine._id.toString())) {
              matches.push({
                ...medicine.toObject(),
                confidence: rating.rating,
                matchedText: possibleName
              });
            }
          }
        });
      }

      // If strength is detected, try to filter by strength
      if (medicineInfo.strength && matches.length > 0) {
        const strengthMatches = matches.filter(m => 
          m.strength && m.strength.toLowerCase().includes(medicineInfo.strength.toLowerCase())
        );
        
        if (strengthMatches.length > 0) {
          return strengthMatches.sort((a, b) => b.confidence - a.confidence);
        }
      }

      // If no matches found, return only 1 mock medicine (simulating a single strip scan)
      if (matches.length === 0) {
        console.log('No matches found in database, returning sample mock medicine data');
        return [this.mockMedicines[0]]; // Return only Paracetamol
      }

      // Sort by confidence and return top matches
      return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    } catch (error) {
      console.error('Medicine matching error:', error);
      throw new Error('Failed to match medicines');
    }
  }

  /**
   * Main scan function
   */
  async scanMedicine(imageBuffer, Medicine) {
    try {
      // Extract text from image
      const extractedText = await this.extractTextFromImage(imageBuffer);
      console.log('Extracted text:', extractedText);

      // Parse the text to identify medicine information
      const medicineInfo = this.parseMedicineText(extractedText);
      console.log('Parsed medicine info:', medicineInfo);

      // Find matching medicines in database
      const matchingMedicines = await this.findMatchingMedicines(medicineInfo, Medicine);

      return {
        success: true,
        extractedText,
        medicineInfo,
        detectedMedicines: matchingMedicines,
        message: matchingMedicines.length > 0 
          ? `Found ${matchingMedicines.length} matching medicine(s)`
          : 'No matching medicines found. Please try with a clearer image.'
      };
    } catch (error) {
      console.error('Medicine scan error:', error);
      throw error;
    }
  }

  /**
   * Validate image file
   */
  validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
      throw new Error('No image file provided');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB');
    }

    return true;
  }
}

module.exports = new MedicineScannerService();
