import { collection, addDoc, getDocs, query, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Sample medicines data
const medicines = [
  {
    name: "Paracetamol 500mg",
    description: "Pain reliever and fever reducer for adults and children.",
    price: 25.99,
    stockQuantity: 100,
    manufacturer: "MediCorp",
    category: "Pain Relief",
    imageUrl: "https://via.placeholder.com/300x300?text=Paracetamol",
    requiresPrescription: false,
    dosage: "500mg",
    expiryDate: Timestamp.fromDate(new Date(2025, 5, 15)), // June 15, 2025
    manufacturingDate: Timestamp.fromDate(new Date(2023, 5, 15)), // June 15, 2023
  },
  {
    name: "Ibuprofen 400mg",
    description: "Non-steroidal anti-inflammatory drug (NSAID) for pain and inflammation.",
    price: 35.50,
    stockQuantity: 75,
    manufacturer: "HealthPharm",
    category: "Pain Relief",
    imageUrl: "https://via.placeholder.com/300x300?text=Ibuprofen",
    requiresPrescription: false,
    dosage: "400mg",
    expiryDate: Timestamp.fromDate(new Date(2025, 8, 20)), // September 20, 2025
    manufacturingDate: Timestamp.fromDate(new Date(2023, 8, 20)), // September 20, 2023
  },
  {
    name: "Amoxicillin 500mg",
    description: "Antibiotic used to treat bacterial infections.",
    price: 120.75,
    stockQuantity: 50,
    manufacturer: "BioMed",
    category: "Antibiotics",
    imageUrl: "https://via.placeholder.com/300x300?text=Amoxicillin",
    requiresPrescription: true,
    dosage: "500mg",
    expiryDate: Timestamp.fromDate(new Date(2024, 11, 10)), // December 10, 2024
    manufacturingDate: Timestamp.fromDate(new Date(2023, 1, 10)), // February 10, 2023
  },
  {
    name: "Cetirizine 10mg",
    description: "Antihistamine for allergy relief.",
    price: 45.25,
    stockQuantity: 120,
    manufacturer: "AllergyRelief",
    category: "Allergy",
    imageUrl: "https://via.placeholder.com/300x300?text=Cetirizine",
    requiresPrescription: false,
    dosage: "10mg",
    expiryDate: Timestamp.fromDate(new Date(2025, 3, 5)), // April 5, 2025
    manufacturingDate: Timestamp.fromDate(new Date(2023, 3, 5)), // April 5, 2023
  },
  {
    name: "Omeprazole 20mg",
    description: "Proton pump inhibitor for reducing stomach acid.",
    price: 85.99,
    stockQuantity: 60,
    manufacturer: "GastroHealth",
    category: "Digestive Health",
    imageUrl: "https://via.placeholder.com/300x300?text=Omeprazole",
    requiresPrescription: false,
    dosage: "20mg",
    expiryDate: Timestamp.fromDate(new Date(2025, 1, 25)), // February 25, 2025
    manufacturingDate: Timestamp.fromDate(new Date(2023, 1, 25)), // February 25, 2023
  }
];

// Sample products data
const products = [
  {
    name: "Digital Thermometer",
    description: "Accurate digital thermometer for body temperature measurement.",
    price: 299.99,
    stockQuantity: 30,
    manufacturer: "MediTech",
    category: "Medical Devices",
    imageUrl: "https://via.placeholder.com/300x300?text=Thermometer",
  },
  {
    name: "Blood Pressure Monitor",
    description: "Automatic blood pressure monitor for home use.",
    price: 1499.99,
    stockQuantity: 15,
    manufacturer: "HealthMonitor",
    category: "Medical Devices",
    imageUrl: "https://via.placeholder.com/300x300?text=BP+Monitor",
  },
  {
    name: "First Aid Kit",
    description: "Comprehensive first aid kit for home and travel.",
    price: 499.50,
    stockQuantity: 25,
    manufacturer: "SafetyFirst",
    category: "First Aid",
    imageUrl: "https://via.placeholder.com/300x300?text=First+Aid+Kit",
  },
  {
    name: "Hand Sanitizer 500ml",
    description: "Alcohol-based hand sanitizer for effective germ protection.",
    price: 150.00,
    stockQuantity: 100,
    manufacturer: "CleanHands",
    category: "Hygiene",
    imageUrl: "https://via.placeholder.com/300x300?text=Hand+Sanitizer",
  },
  {
    name: "Vitamin C 1000mg",
    description: "Dietary supplement to support immune health.",
    price: 350.25,
    stockQuantity: 80,
    manufacturer: "VitaHealth",
    category: "Supplements",
    imageUrl: "https://via.placeholder.com/300x300?text=Vitamin+C",
  }
];

// Function to seed the database
export const seedDatabase = async (forceReseed = false) => {
  try {
    console.log("Starting database seeding...");
    
    // Force re-seeding for testing
    if (forceReseed) {
      console.log("Force re-seeding enabled. Deleting existing data...");
      
      // Get all medicines
      const medicinesSnapshot = await getDocs(collection(db, "medicines"));
      // Delete each medicine
      const medicineDeletePromises = [];
      medicinesSnapshot.forEach(doc => {
        medicineDeletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(medicineDeletePromises);
      
      // Get all products
      const productsSnapshot = await getDocs(collection(db, "products"));
      // Delete each product
      const productDeletePromises = [];
      productsSnapshot.forEach(doc => {
        productDeletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(productDeletePromises);
      
      console.log("Existing data deleted.");
    }
    
    // Check if medicines already exist
    const medicinesQuery = query(collection(db, "medicines"), where("name", "==", "Paracetamol 500mg"));
    const medicinesSnapshot = await getDocs(medicinesQuery);
    
    if (medicinesSnapshot.empty || forceReseed) {
      console.log("Adding medicines...");
      for (const medicine of medicines) {
        await addDoc(collection(db, "medicines"), medicine);
      }
      console.log(`Added ${medicines.length} medicines`);
    } else {
      console.log("Medicines already exist, skipping...");
    }
    
    // Check if products already exist
    const productsQuery = query(collection(db, "products"), where("name", "==", "Digital Thermometer"));
    const productsSnapshot = await getDocs(productsQuery);
    
    if (productsSnapshot.empty || forceReseed) {
      console.log("Adding products...");
      for (const product of products) {
        await addDoc(collection(db, "products"), product);
      }
      console.log(`Added ${products.length} products`);
    } else {
      console.log("Products already exist, skipping...");
    }
    
    console.log("Database seeding completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, error: error.message };
  }
};

export default seedDatabase;