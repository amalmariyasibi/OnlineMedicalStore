const mongoose = require('mongoose');

const prescriptionCorrectionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  prescriptionId: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  correctedText: {
    type: String,
    required: true
  },
  extractedMedicineName: {
    type: String,
    required: true
  },
  correctedMedicineId: {
    type: String,
    required: true
  },
  correctedMedicineName: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster lookups
prescriptionCorrectionSchema.index({ extractedText: 1 });
prescriptionCorrectionSchema.index({ extractedMedicineName: 1 });

module.exports = mongoose.model('PrescriptionCorrection', prescriptionCorrectionSchema);
