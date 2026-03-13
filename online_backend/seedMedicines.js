const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('./models/Medicine');

dotenv.config();

const sampleMedicines = [
  {
    name: 'Paracetamol',
    manufacturer: 'Generic Pharma',
    category: 'Tablet',
    description: 'Pain reliever and fever reducer',
    strength: '500mg',
    price: 25.50,
    mrp: 30.00,
    discount: 15,
    inStock: true,
    stockQuantity: 500,
    prescriptionRequired: false,
    uses: 'Used to treat pain and fever',
    sideEffects: 'Nausea, stomach pain, loss of appetite',
    dosage: '1-2 tablets every 4-6 hours',
    warnings: 'Do not exceed 4000mg in 24 hours',
    activeIngredients: ['Paracetamol'],
    tags: ['pain relief', 'fever', 'headache'],
    rating: 4.5,
    reviewCount: 120
  },
  {
    name: 'Ibuprofen',
    manufacturer: 'HealthCare Ltd',
    category: 'Tablet',
    description: 'Nonsteroidal anti-inflammatory drug (NSAID)',
    strength: '400mg',
    price: 45.00,
    mrp: 55.00,
    discount: 18,
    inStock: true,
    stockQuantity: 300,
    prescriptionRequired: false,
    uses: 'Pain relief, fever reduction, inflammation',
    sideEffects: 'Upset stomach, mild heartburn, dizziness',
    dosage: '1 tablet every 6-8 hours',
    warnings: 'Take with food or milk',
    activeIngredients: ['Ibuprofen'],
    tags: ['pain relief', 'anti-inflammatory', 'fever'],
    rating: 4.3,
    reviewCount: 85
  },
  {
    name: 'Amoxicillin',
    manufacturer: 'Antibio Pharma',
    category: 'Capsule',
    description: 'Antibiotic used to treat bacterial infections',
    strength: '500mg',
    price: 120.00,
    mrp: 150.00,
    discount: 20,
    inStock: true,
    stockQuantity: 200,
    prescriptionRequired: true,
    uses: 'Treats bacterial infections',
    sideEffects: 'Nausea, vomiting, diarrhea',
    dosage: '1 capsule three times daily',
    warnings: 'Complete the full course',
    activeIngredients: ['Amoxicillin'],
    tags: ['antibiotic', 'infection'],
    rating: 4.6,
    reviewCount: 95
  },
  {
    name: 'Cetirizine',
    manufacturer: 'Allergy Care',
    category: 'Tablet',
    description: 'Antihistamine for allergy relief',
    strength: '10mg',
    price: 35.00,
    mrp: 42.00,
    discount: 17,
    inStock: true,
    stockQuantity: 400,
    prescriptionRequired: false,
    uses: 'Relieves allergy symptoms',
    sideEffects: 'Drowsiness, dry mouth, fatigue',
    dosage: '1 tablet once daily',
    warnings: 'May cause drowsiness',
    activeIngredients: ['Cetirizine Hydrochloride'],
    tags: ['allergy', 'antihistamine'],
    rating: 4.4,
    reviewCount: 110
  },
  {
    name: 'Omeprazole',
    manufacturer: 'Gastro Health',
    category: 'Capsule',
    description: 'Proton pump inhibitor for acid reflux',
    strength: '20mg',
    price: 85.00,
    mrp: 100.00,
    discount: 15,
    inStock: true,
    stockQuantity: 250,
    prescriptionRequired: false,
    uses: 'Treats acid reflux and heartburn',
    sideEffects: 'Headache, nausea, stomach pain',
    dosage: '1 capsule daily before breakfast',
    warnings: 'Take on empty stomach',
    activeIngredients: ['Omeprazole'],
    tags: ['acid reflux', 'heartburn', 'gastric'],
    rating: 4.7,
    reviewCount: 140
  },
  {
    name: 'Metformin',
    manufacturer: 'Diabetes Care',
    category: 'Tablet',
    description: 'Oral diabetes medicine',
    strength: '500mg',
    price: 65.00,
    mrp: 80.00,
    discount: 19,
    inStock: true,
    stockQuantity: 350,
    prescriptionRequired: true,
    uses: 'Controls blood sugar in type 2 diabetes',
    sideEffects: 'Nausea, diarrhea, stomach upset',
    dosage: '1-2 tablets twice daily with meals',
    warnings: 'Monitor blood sugar regularly',
    activeIngredients: ['Metformin Hydrochloride'],
    tags: ['diabetes', 'blood sugar'],
    rating: 4.5,
    reviewCount: 200
  },
  {
    name: 'Aspirin',
    manufacturer: 'CardioHealth',
    category: 'Tablet',
    description: 'Pain reliever and blood thinner',
    strength: '75mg',
    price: 20.00,
    mrp: 25.00,
    discount: 20,
    inStock: true,
    stockQuantity: 600,
    prescriptionRequired: false,
    uses: 'Pain relief, fever reduction, heart health',
    sideEffects: 'Stomach upset, heartburn',
    dosage: '1 tablet daily',
    warnings: 'Take with food',
    activeIngredients: ['Acetylsalicylic Acid'],
    tags: ['pain relief', 'heart health', 'blood thinner'],
    rating: 4.6,
    reviewCount: 180
  },
  {
    name: 'Azithromycin',
    manufacturer: 'Antibio Pharma',
    category: 'Tablet',
    description: 'Antibiotic for bacterial infections',
    strength: '250mg',
    price: 95.00,
    mrp: 115.00,
    discount: 17,
    inStock: true,
    stockQuantity: 180,
    prescriptionRequired: true,
    uses: 'Treats respiratory and skin infections',
    sideEffects: 'Diarrhea, nausea, stomach pain',
    dosage: '1 tablet once daily for 3-5 days',
    warnings: 'Complete the full course',
    activeIngredients: ['Azithromycin'],
    tags: ['antibiotic', 'infection', 'respiratory'],
    rating: 4.4,
    reviewCount: 75
  },
  {
    name: 'Vitamin D3',
    manufacturer: 'Wellness Pharma',
    category: 'Capsule',
    description: 'Vitamin D supplement',
    strength: '1000IU',
    price: 150.00,
    mrp: 180.00,
    discount: 17,
    inStock: true,
    stockQuantity: 450,
    prescriptionRequired: false,
    uses: 'Supports bone health and immunity',
    sideEffects: 'Rare: nausea, constipation',
    dosage: '1 capsule daily',
    warnings: 'Do not exceed recommended dose',
    activeIngredients: ['Cholecalciferol'],
    tags: ['vitamin', 'supplement', 'bone health'],
    rating: 4.8,
    reviewCount: 250
  },
  {
    name: 'Cough Syrup',
    manufacturer: 'Respiratory Care',
    category: 'Syrup',
    description: 'Relief from cough and cold',
    strength: '100ml',
    price: 75.00,
    mrp: 90.00,
    discount: 17,
    inStock: true,
    stockQuantity: 220,
    prescriptionRequired: false,
    uses: 'Relieves cough and throat irritation',
    sideEffects: 'Drowsiness, dizziness',
    dosage: '10ml three times daily',
    warnings: 'May cause drowsiness',
    activeIngredients: ['Dextromethorphan', 'Guaifenesin'],
    tags: ['cough', 'cold', 'respiratory'],
    rating: 4.2,
    reviewCount: 90
  },
  {
    name: 'Tr Bellidopnas',
    manufacturer: 'Herbal Remedies',
    category: 'Tincture',
    description: 'Belladonna tincture for various ailments',
    strength: '15ml',
    price: 185.00,
    mrp: 220.00,
    discount: 16,
    inStock: true,
    stockQuantity: 75,
    prescriptionRequired: true,
    uses: 'Used for pain relief and as an antispasmodic',
    sideEffects: 'Dry mouth, blurred vision, dizziness',
    dosage: 'As directed by physician',
    warnings: 'Use only under medical supervision',
    activeIngredients: ['Belladonna Alkaloids'],
    tags: ['tincture', 'belladonna', 'pain relief'],
    rating: 4.3,
    reviewCount: 45
  },
  {
    name: 'Amphotericin B',
    manufacturer: 'AntiFungal Pharma',
    category: 'Injection',
    description: 'Antifungal medication for serious infections',
    strength: '50mg/10ml',
    price: 2500.00,
    mrp: 3000.00,
    discount: 17,
    inStock: true,
    stockQuantity: 50,
    prescriptionRequired: true,
    uses: 'Treatment of severe fungal infections',
    sideEffects: 'Fever, chills, nausea, kidney problems',
    dosage: 'As prescribed by doctor',
    warnings: 'Requires hospital administration',
    activeIngredients: ['Amphotericin B'],
    tags: ['antifungal', 'injection', 'serious infections'],
    rating: 4.7,
    reviewCount: 30
  }
];

const seedMedicines = async () => {
  try {
    // Connect to MongoDB (remove deprecated options)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-store');

    console.log('Connected to MongoDB');

    // Clear existing medicines
    await Medicine.deleteMany({});
    console.log('Cleared existing medicines');

    // Insert sample medicines
    const inserted = await Medicine.insertMany(sampleMedicines);
    console.log(`✅ Successfully seeded ${inserted.length} medicines`);

    // Display inserted medicines
    console.log('\nInserted Medicines:');
    inserted.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name} - ${med.strength} - ₹${med.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding medicines:', error);
    process.exit(1);
  }
};

// Run the seeder
seedMedicines();
