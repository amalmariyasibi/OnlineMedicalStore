import { collection, addDoc, getDocs, query, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Sample orders data
const orders = [
  // Add more recent orders with different statuses
  {
    userId: "user123",
    customerName: "John Doe",
    items: [
      {
        id: "medicine6",
        name: "Vitamin D3 1000IU",
        price: 350.00,
        quantity: 1,
        type: "medicine"
      }
    ],
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "9876543210",
      email: "john@example.com"
    },
    paymentMethod: "online",
    subtotal: 350.00,
    shippingCost: 50.00,
    tax: 35.00,
    total: 435.00,
    status: "pending",
    createdAt: Timestamp.fromDate(new Date()), // Today
    updatedAt: Timestamp.fromDate(new Date())
  },
  {
    userId: "user456",
    customerName: "Jane Smith",
    items: [
      {
        id: "product4",
        name: "Pulse Oximeter",
        price: 1999.00,
        quantity: 1,
        type: "product"
      }
    ],
    shippingAddress: {
      name: "Jane Smith",
      street: "456 Park Avenue",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      phone: "8765432109",
      email: "jane@example.com"
    },
    paymentMethod: "online",
    subtotal: 1999.00,
    shippingCost: 0.00,
    tax: 199.90,
    total: 2198.90,
    status: "processing",
    createdAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 1))), // Yesterday
    updatedAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 1)))
  },
  {
    userId: "user789",
    customerName: "Robert Johnson",
    items: [
      {
        id: "medicine7",
        name: "Multivitamin Tablets",
        price: 450.00,
        quantity: 1,
        type: "medicine"
      },
      {
        id: "product5",
        name: "Hand Sanitizer",
        price: 99.00,
        quantity: 2,
        type: "product"
      }
    ],
    shippingAddress: {
      name: "Robert Johnson",
      street: "789 Oak Street",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      phone: "7654321098",
      email: "robert@example.com"
    },
    paymentMethod: "cod",
    subtotal: 648.00,
    shippingCost: 50.00,
    tax: 64.80,
    total: 762.80,
    status: "shipped",
    createdAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 2))), // 2 days ago
    updatedAt: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() - 1))) // 1 day ago
  },
  {
    userId: "user123", // Replace with actual user ID when testing
    items: [
      {
        id: "medicine1",
        name: "Paracetamol 500mg",
        price: 25.99,
        quantity: 2,
        type: "medicine"
      },
      {
        id: "product1",
        name: "Digital Thermometer",
        price: 299.99,
        quantity: 1,
        type: "product"
      }
    ],
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "9876543210",
      email: "john@example.com"
    },
    paymentMethod: "cod",
    subtotal: 351.97,
    shippingCost: 50.00,
    tax: 35.20,
    totalAmount: 437.17,
    status: "processing",
    createdAt: Timestamp.fromDate(new Date(2023, 10, 15)), // November 15, 2023
    updatedAt: Timestamp.fromDate(new Date(2023, 10, 15))
  },
  {
    userId: "user123", // Replace with actual user ID when testing
    items: [
      {
        id: "medicine2",
        name: "Ibuprofen 400mg",
        price: 35.50,
        quantity: 1,
        type: "medicine"
      }
    ],
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "9876543210",
      email: "john@example.com"
    },
    paymentMethod: "online",
    subtotal: 35.50,
    shippingCost: 50.00,
    tax: 3.55,
    totalAmount: 89.05,
    status: "shipped",
    createdAt: Timestamp.fromDate(new Date(2023, 10, 20)), // November 20, 2023
    updatedAt: Timestamp.fromDate(new Date(2023, 10, 21))
  },
  {
    userId: "user456", // Replace with actual user ID when testing
    items: [
      {
        id: "product2",
        name: "Blood Pressure Monitor",
        price: 1499.99,
        quantity: 1,
        type: "product"
      },
      {
        id: "medicine3",
        name: "Amoxicillin 500mg",
        price: 120.75,
        quantity: 1,
        type: "medicine"
      }
    ],
    shippingAddress: {
      name: "Jane Smith",
      street: "456 Park Avenue",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      phone: "8765432109",
      email: "jane@example.com"
    },
    paymentMethod: "online",
    subtotal: 1620.74,
    shippingCost: 0.00, // Free shipping
    tax: 162.07,
    totalAmount: 1782.81,
    status: "delivered",
    createdAt: Timestamp.fromDate(new Date(2023, 10, 10)), // November 10, 2023
    updatedAt: Timestamp.fromDate(new Date(2023, 10, 12))
  },
  {
    userId: "user789", // Replace with actual user ID when testing
    items: [
      {
        id: "product3",
        name: "First Aid Kit",
        price: 499.50,
        quantity: 1,
        type: "product"
      }
    ],
    shippingAddress: {
      name: "Robert Johnson",
      street: "789 Oak Street",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      phone: "7654321098",
      email: "robert@example.com"
    },
    paymentMethod: "cod",
    subtotal: 499.50,
    shippingCost: 50.00,
    tax: 49.95,
    totalAmount: 599.45,
    status: "out_for_delivery",
    createdAt: Timestamp.fromDate(new Date(2023, 10, 22)), // November 22, 2023
    updatedAt: Timestamp.fromDate(new Date(2023, 10, 23))
  },
  {
    userId: "user123", // Replace with actual user ID when testing
    items: [
      {
        id: "medicine4",
        name: "Cetirizine 10mg",
        price: 45.25,
        quantity: 2,
        type: "medicine"
      },
      {
        id: "medicine5",
        name: "Omeprazole 20mg",
        price: 85.99,
        quantity: 1,
        type: "medicine"
      }
    ],
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "9876543210",
      email: "john@example.com"
    },
    paymentMethod: "online",
    subtotal: 176.49,
    shippingCost: 50.00,
    tax: 17.65,
    totalAmount: 244.14,
    status: "processing",
    createdAt: Timestamp.fromDate(new Date()), // Today
    updatedAt: Timestamp.fromDate(new Date())
  }
];

// Function to seed orders
export const seedOrders = async (forceReseed = false) => {
  try {
    console.log("Starting orders seeding...");
    
    // Force re-seeding for testing
    if (forceReseed) {
      console.log("Force re-seeding enabled. Deleting existing orders...");
      
      // Get all orders
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      // Delete each order
      const orderDeletePromises = [];
      ordersSnapshot.forEach(doc => {
        orderDeletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(orderDeletePromises);
      
      console.log("Existing orders deleted.");
    }
    
    // Check if orders already exist
    const ordersQuery = query(collection(db, "orders"));
    const ordersSnapshot = await getDocs(ordersQuery);
    
    if (ordersSnapshot.empty || forceReseed) {
      console.log("Adding orders...");
      for (const order of orders) {
        await addDoc(collection(db, "orders"), order);
      }
      console.log(`Added ${orders.length} orders`);
    } else {
      console.log("Orders already exist, skipping...");
    }
    
    console.log("Orders seeding completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("Error seeding orders:", error);
    return { success: false, error: error.message };
  }
};

export default seedOrders;