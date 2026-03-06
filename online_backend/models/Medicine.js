const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Other']
  },
  description: {
    type: String,
    trim: true
  },
  strength: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  mrp: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  },
  uses: {
    type: String,
    trim: true
  },
  sideEffects: {
    type: String,
    trim: true
  },
  dosage: {
    type: String,
    trim: true
  },
  warnings: {
    type: String,
    trim: true
  },
  activeIngredients: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for text search
medicineSchema.index({ 
  name: 'text', 
  manufacturer: 'text', 
  description: 'text',
  uses: 'text',
  activeIngredients: 'text'
});

// Index for common queries
medicineSchema.index({ category: 1, inStock: 1 });
medicineSchema.index({ price: 1 });
medicineSchema.index({ name: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
