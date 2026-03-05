import { addProduct } from '../firebase';

// Dummy products with medical/healthcare items and proper image URLs
const dummyProducts = [
  {
    name: "Digital Thermometer",
    description: "Accurate digital thermometer with LCD display. Fast reading in 60 seconds. Fever alarm and memory function.",
    price: 299.99,
    category: "Medical Devices",
    stockQuantity: 50,
    imageUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&h=400&fit=crop&crop=center",
    manufacturer: "HealthTech",
    dosage: "",
    sideEffects: "",
    requiresPrescription: false
  },
  {
    name: "Blood Pressure Monitor",
    description: "Digital blood pressure monitor with large LCD display. Automatic inflation and WHO indicator.",
    price: 1299.99,
    category: "Medical Devices",
    stockQuantity: 25,
    imageUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop&crop=center",
    manufacturer: "CarePlus",
    dosage: "",
    sideEffects: "",
    requiresPrescription: false
  },
  {
    name: "Pulse Oximeter",
    description: "Fingertip pulse oximeter for measuring blood oxygen saturation and pulse rate. Portable and easy to use.",
    price: 899.99,
    category: "Medical Devices",
    stockQuantity: 40,
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=400&fit=crop&crop=center",
    manufacturer: "OxyCheck",
    dosage: "",
    sideEffects: "",
    requiresPrescription: false
  },
  {
    name: "Paracetamol 500mg",
    description: "Pain relief and fever reducer tablets. Effective for headaches, muscle aches, and cold symptoms.",
    price: 45.50,
    category: "Pain Relief",
    stockQuantity: 100,
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=400&fit=crop&crop=center",
    manufacturer: "PharmaCorp",
    dosage: "1-2 tablets every 4-6 hours as needed",
    sideEffects: "Rare: skin rash, nausea",
    requiresPrescription: false
  },
  {
    name: "Vitamin D3 Tablets",
    description: "High-strength Vitamin D3 supplements for bone health and immune system support. 60 tablets per bottle.",
    price: 249.99,
    category: "Vitamins & Supplements",
    stockQuantity: 75,
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=400&h=400&fit=crop&crop=center",
    manufacturer: "VitaHealth",
    dosage: "One tablet daily with food",
    sideEffects: "Rare: nausea, vomiting if overdosed",
    requiresPrescription: false
  },
  {
    name: "First Aid Kit",
    description: "Complete first aid kit with bandages, antiseptic wipes, gauze, tape, and emergency supplies.",
    price: 599.99,
    category: "First Aid",
    stockQuantity: 30,
    imageUrl: "https://images.unsplash.com/photo-1603398938235-d4d3d2b0b6b2?w=400&h=400&fit=crop&crop=center",
    manufacturer: "SafeCare",
    dosage: "",
    sideEffects: "",
    requiresPrescription: false
  },
  {
    name: "Hand Sanitizer 500ml",
    description: "70% alcohol-based hand sanitizer gel. Kills 99.9% of germs and bacteria. Moisturizing formula.",
    price: 149.99,
    category: "Hygiene",
    stockQuantity: 200,
    imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=400&fit=crop&crop=center",
    manufacturer: "CleanHands",
    dosage: "",
    sideEffects: "",
    requiresPrescription: false
  },
  {
    name: "Surgical Face Masks (Pack of 50)",
    description: "3-layer disposable surgical face masks. Fluid resistant and comfortable for extended wear.",
    price: 199.99,
    category: "Personal Protection",
    stockQuantity: 150,
    imageUrl: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=400&h=400&fit=crop&crop=center",
    manufacturer: "MedProtect",
    dosage: "",
    sideEffects: "",
    requiresPrescription: false
  },
  {
    name: "Omega-3 Fish Oil Capsules",
    description: "High-quality omega-3 fish oil capsules for heart and brain health. 90 capsules per bottle.",
    price: 399.99,
    category: "Vitamins & Supplements",
    stockQuantity: 60,
    imageUrl: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop&crop=center",
    manufacturer: "OceanHealth",
    dosage: "2 capsules daily with meals",
    sideEffects: "Mild: fishy aftertaste, burping",
    requiresPrescription: false
  },
  {
    name: "Insulin Pen",
    description: "Pre-filled insulin pen for diabetes management. Easy-to-use with precise dosing mechanism.",
    price: 1599.99,
    category: "Diabetes Care",
    stockQuantity: 20,
    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=center",
    manufacturer: "DiabetesPlus",
    dosage: "As prescribed by physician",
    sideEffects: "Hypoglycemia, injection site reactions",
    requiresPrescription: true
  },
  {
    name: "Nebulizer Machine",
    description: "Compact nebulizer for respiratory treatments. Quiet operation and efficient medication delivery.",
    price: 2499.99,
    category: "Respiratory Care",
    stockQuantity: 15,
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop&crop=center",
    manufacturer: "BreathEasy",
    dosage: "",
    sideEffects: "",
    requiresPrescription: false
  },
  {
    name: "Antacid Tablets",
    description: "Fast-acting antacid tablets for heartburn and acid indigestion relief. Chewable tablets with mint flavor.",
    price: 89.99,
    category: "Digestive Health",
    stockQuantity: 80,
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=400&fit=crop&crop=center",
    manufacturer: "DigestWell",
    dosage: "1-2 tablets as needed after meals",
    sideEffects: "Rare: constipation, diarrhea",
    requiresPrescription: false
  }
];

// Function to add all dummy products
export const addAllDummyProducts = async () => {
  console.log("Starting to add dummy products...");
  const results = [];
  
  for (let i = 0; i < dummyProducts.length; i++) {
    const product = dummyProducts[i];
    console.log(`Adding product ${i + 1}/${dummyProducts.length}: ${product.name}`);
    
    try {
      const result = await addProduct(product);
      if (result.success) {
        console.log(`✅ Successfully added: ${product.name}`);
        results.push({ success: true, product: product.name, id: result.productId });
      } else {
        console.error(`❌ Failed to add ${product.name}:`, result.error);
        results.push({ success: false, product: product.name, error: result.error });
      }
    } catch (error) {
      console.error(`❌ Error adding ${product.name}:`, error);
      results.push({ success: false, product: product.name, error: error.message });
    }
    
    // Add a small delay to avoid overwhelming Firebase
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("\n📊 Summary:");
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`✅ Successfully added: ${successful} products`);
  console.log(`❌ Failed to add: ${failed} products`);
  
  if (failed > 0) {
    console.log("\nFailed products:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.product}: ${r.error}`);
    });
  }
  
  return results;
};

// Function to add a single product (for testing)
export const addSingleDummyProduct = async (index = 0) => {
  if (index >= dummyProducts.length) {
    console.error("Invalid product index");
    return { success: false, error: "Invalid product index" };
  }
  
  const product = dummyProducts[index];
  console.log(`Adding product: ${product.name}`);
  
  try {
    const result = await addProduct(product);
    if (result.success) {
      console.log(`✅ Successfully added: ${product.name}`);
    } else {
      console.error(`❌ Failed to add ${product.name}:`, result.error);
    }
    return result;
  } catch (error) {
    console.error(`❌ Error adding ${product.name}:`, error);
    return { success: false, error: error.message };
  }
};

export default dummyProducts;
