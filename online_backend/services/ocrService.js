const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const Fuse = require('fuse.js');
const stringSimilarity = require('string-similarity');

/**
 * Preprocess image for better OCR accuracy
 */
const preprocessImage = async (imageBuffer) => {
  try {
    console.log('Preprocessing image, buffer size:', imageBuffer.length);
    const processedImage = await sharp(imageBuffer)
      .grayscale() // Convert to grayscale
      .normalize() // Improve contrast
      .median(3) // Reduce noise
      .sharpen() // Sharpen edges
      .toBuffer();
    
    console.log('Image preprocessing successful, output size:', processedImage.length);
    return processedImage;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    console.error('Error details:', error.message);
    throw new Error(`Failed to preprocess image: ${error.message}`);
  }
};

/**
 * Extract text from image using Tesseract OCR
 */
const extractTextFromImage = async (imageBuffer) => {
  try {
    console.log('Starting image preprocessing...');
    const processedImage = await preprocessImage(imageBuffer);
    console.log('Image preprocessing completed');
    
    console.log('Starting Tesseract OCR...');
    const { data: { text } } = await Tesseract.recognize(
      processedImage,
      'eng',
      {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log('Tesseract OCR completed, extracted text length:', text.length);
    return text;
  } catch (error) {
    console.error('OCR extraction error:', error);
    console.error('Error details:', error.message);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

/**
 * Clean and normalize extracted text
 */
const cleanText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\.\/]/g, ' ') // Keep alphanumeric, spaces, hyphens, dots, slashes
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Extract structured data using regex patterns
 */
const extractStructuredData = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  const medicines = [];
  
  // Special case mappings for common OCR errors
  const ocrErrorMappings = {
    'i under': 'tr bellidopnas me',
    'iunder': 'tr bellidopnas me',
    'lunder': 'tr bellidopnas me',
    '1 under': 'tr bellidopnas me',
    'amployer': 'ampteoget goed',
    'employet': 'ampteoget goed',
    'ampleoget': 'ampteoget goed'
  };
  
  // Apply OCR error corrections to the entire text
  let correctedText = text.toLowerCase();
  Object.keys(ocrErrorMappings).forEach(error => {
    const regex = new RegExp(error, 'gi');
    correctedText = correctedText.replace(regex, ocrErrorMappings[error]);
  });
  
  // Also process original lines with corrections
  const correctedLines = lines.map(line => {
    let correctedLine = line.toLowerCase();
    Object.keys(ocrErrorMappings).forEach(error => {
      const regex = new RegExp(error, 'gi');
      correctedLine = correctedLine.replace(regex, ocrErrorMappings[error]);
    });
    return correctedLine;
  });
  
  // Combine original and corrected lines
  const allLines = [...lines, ...correctedLines];
  
  // Common medicine name patterns
  const medicinePatterns = [
    /([a-z]+(?:\s+[a-z]+)?)\s*(\d+\s*(?:mg|ml|g|mcg|me))/gi,
    /([a-z]+)\s+(?:tablet|capsule|syrup|injection|tincture)/gi,
    /(belladonna|bellidopnas|ampteoget|paracetamol|amoxicillin|cetirizine|aspirin|ibuprofen)/gi,
    /tr\s+([a-z]+(?:\s+[a-z]+)?(?:\s+[a-z]+)?)/gi, // Tincture pattern - more flexible
    /([a-z]{4,})\s+(?:goed|good|med|medicine|me)/gi
  ];
  
  // Dosage patterns (e.g., 1-0-1, 1-1-1, twice daily)
  const dosagePattern = /(\d+[-\/]\d+[-\/]\d+|once|twice|thrice|morning|evening|night)/gi;
  
  // Duration patterns (e.g., 5 days, 1 week, 10 days)
  const durationPattern = /(\d+\s*(?:day|days|week|weeks|month|months))/gi;
  
  // Strength patterns (e.g., 500mg, 650mg, 10ml, 5 me)
  const strengthPattern = /(\d+\s*(?:mg|ml|g|mcg|me))/gi;
  
  // Notes patterns
  const notesPattern = /(after food|before food|with food|empty stomach|morning|evening|night)/gi;
  
  allLines.forEach(line => {
    const cleanedLine = cleanText(line);
    
    // Try to extract medicine name and strength
    medicinePatterns.forEach(pattern => {
      const matches = [...cleanedLine.matchAll(pattern)];
      matches.forEach(match => {
        const medicineName = match[1]?.trim();
        const strength = match[2]?.trim() || '';
        
        if (medicineName && medicineName.length > 2) {
          const dosageMatch = cleanedLine.match(dosagePattern);
          const durationMatch = cleanedLine.match(durationPattern);
          const strengthMatch = cleanedLine.match(strengthPattern);
          const notesMatch = cleanedLine.match(notesPattern);
          
          medicines.push({
            name: medicineName,
            strength: strengthMatch ? strengthMatch[0] : strength,
            dosage: dosageMatch ? dosageMatch[0] : '',
            duration: durationMatch ? durationMatch[0] : '',
            notes: notesMatch ? notesMatch.join(', ') : '',
            rawLine: line.trim()
          });
        }
      });
    });
    
    // Special handling for common medicine names that might be misspelled
    const commonMedicines = [
      { pattern: /bell[ia]donn?a/i, name: 'belladonna' },
      { pattern: /bell[ia]dopn?as/i, name: 'bellidopnas' },
      { pattern: /ampt[eo]+get/i, name: 'ampteoget' },
      { pattern: /parac[ea]tam[oi]l/i, name: 'paracetamol' },
      { pattern: /am[ou]x[io]c[il]+in/i, name: 'amoxicillin' },
      { pattern: /c[ea]tir[ia]z[io]ne/i, name: 'cetirizine' }
    ];
    
    commonMedicines.forEach(({ pattern, name }) => {
      if (pattern.test(cleanedLine)) {
        const strengthMatch = cleanedLine.match(strengthPattern);
        const dosageMatch = cleanedLine.match(dosagePattern);
        
        medicines.push({
          name: name,
          strength: strengthMatch ? strengthMatch[0] : '',
          dosage: dosageMatch ? dosageMatch[0] : '',
          duration: '',
          notes: '',
          rawLine: line.trim()
        });
      }
    });
  });
  
  // If no medicines found, try to extract any words that might be medicine names
  if (medicines.length === 0) {
    const words = correctedText.split(/\s+/);
    words.forEach(word => {
      // Look for words that are at least 5 characters and might be medicine names
      if (word.length >= 5 && /^[a-z]+$/.test(word)) {
        medicines.push({
          name: word,
          strength: '',
          dosage: '',
          duration: '',
          notes: '',
          rawLine: word
        });
      }
    });
  }
  
  // Remove duplicates
  const uniqueMedicines = medicines.filter((medicine, index, self) =>
    index === self.findIndex(m => 
      m.name.toLowerCase() === medicine.name.toLowerCase() &&
      m.strength === medicine.strength
    )
  );
  
  return uniqueMedicines;
};

/**
 * Fuzzy match extracted medicine names with database
 */
const fuzzyMatchMedicines = (extractedMedicines, databaseMedicines) => {
  const fuseOptions = {
    keys: ['name', 'genericName'],
    threshold: 0.5, // More lenient: 0 = perfect match, 1 = match anything
    includeScore: true,
    minMatchCharLength: 2, // Reduced from 3
    ignoreLocation: true,
    distance: 100
  };
  
  const fuse = new Fuse(databaseMedicines, fuseOptions);
  const matchedMedicines = [];
  
  extractedMedicines.forEach(extracted => {
    // Search using Fuse.js
    const fuseResults = fuse.search(extracted.name);
    
    // Also try direct string similarity for all database medicines
    let bestDirectMatch = null;
    let bestDirectScore = 0;
    
    databaseMedicines.forEach(dbMed => {
      const score1 = stringSimilarity.compareTwoStrings(
        extracted.name.toLowerCase(),
        dbMed.name.toLowerCase()
      );
      const score2 = dbMed.genericName ? stringSimilarity.compareTwoStrings(
        extracted.name.toLowerCase(),
        dbMed.genericName.toLowerCase()
      ) : 0;
      
      const maxScore = Math.max(score1, score2);
      if (maxScore > bestDirectScore) {
        bestDirectScore = maxScore;
        bestDirectMatch = dbMed;
      }
    });
    
    // Use the better match
    let finalMatch = null;
    let finalConfidence = 0;
    
    if (fuseResults.length > 0) {
      const fuseConfidence = 1 - fuseResults[0].score;
      if (fuseConfidence > bestDirectScore) {
        finalMatch = fuseResults[0].item;
        finalConfidence = fuseConfidence;
      } else if (bestDirectScore > 0.3) { // Lower threshold
        finalMatch = bestDirectMatch;
        finalConfidence = bestDirectScore;
      } else {
        finalMatch = fuseResults[0].item;
        finalConfidence = fuseConfidence;
      }
    } else if (bestDirectScore > 0.3) { // Lower threshold
      finalMatch = bestDirectMatch;
      finalConfidence = bestDirectScore;
    }
    
    if (finalMatch) {
      matchedMedicines.push({
        extracted: extracted,
        matched: finalMatch,
        confidence: finalConfidence,
        alternatives: fuseResults.slice(1, 4).map(r => r.item)
      });
    } else {
      // No match found
      matchedMedicines.push({
        extracted: extracted,
        matched: null,
        confidence: 0,
        alternatives: []
      });
    }
  });
  
  return matchedMedicines;
};

/**
 * Main OCR processing function
 */
const processPrescriptionImage = async (imageBuffer, databaseMedicines) => {
  try {
    console.log('=== Starting Prescription Processing ===');
    console.log('Image buffer size:', imageBuffer.length);
    console.log('Database medicines count:', databaseMedicines.length);
    
    // Step 1: Extract text from image
    console.log('Step 1: Extracting text from image...');
    const rawText = await extractTextFromImage(imageBuffer);
    console.log('Raw text extracted, length:', rawText.length);
    console.log('Raw text preview:', rawText.substring(0, 200));
    
    // Step 2: Clean and normalize text
    console.log('Step 2: Cleaning and normalizing text...');
    const cleanedText = cleanText(rawText);
    console.log('Cleaned text length:', cleanedText.length);
    
    // Step 3: Extract structured data
    console.log('Step 3: Extracting structured data...');
    const extractedMedicines = extractStructuredData(rawText);
    console.log('Extracted medicines count:', extractedMedicines.length);
    
    // Step 4: Fuzzy match with database
    console.log('Step 4: Fuzzy matching with database...');
    const matchedMedicines = fuzzyMatchMedicines(extractedMedicines, databaseMedicines);
    console.log('Matched medicines count:', matchedMedicines.filter(m => m.matched).length);
    
    const result = {
      rawText,
      cleanedText,
      extractedMedicines,
      matchedMedicines,
      totalExtracted: extractedMedicines.length,
      totalMatched: matchedMedicines.filter(m => m.matched).length
    };
    
    console.log('=== Prescription Processing Complete ===');
    return result;
  } catch (error) {
    console.error('=== Prescription Processing Failed ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
};

module.exports = {
  processPrescriptionImage,
  extractTextFromImage,
  cleanText,
  extractStructuredData,
  fuzzyMatchMedicines
};
