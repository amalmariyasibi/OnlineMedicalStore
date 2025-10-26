import React, { useState } from "react";
import { Link } from "react-router-dom";
import { seedDatabase } from "../seedData";
import { useAuth } from "../contexts/AuthContext";
import { addAllDummyProducts, addSingleDummyProduct } from "../utils/addDummyProducts";

function Home() {
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const { currentUser } = useAuth();

  // Function to handle database seeding
  const handleSeedDatabase = async () => {
    try {
      setSeeding(true);
      setSeedMessage("Seeding database...");
      
      const result = await seedDatabase();
      
      if (result.success) {
        setSeedMessage("Database seeded successfully! You can now search for products like 'Paracetamol'.");
      } else {
        setSeedMessage(`Error: ${result.error || "Unknown error occurred"}`);
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      setSeedMessage(`Error: ${error.message || "Unknown error occurred"}`);
    } finally {
      setSeeding(false);
    }
  };

  // Handlers to add dummy products
  const handleAddSingleProduct = async () => {
    try {
      setAdding(true);
      setAddMessage("Adding a sample product...");
      const result = await addSingleDummyProduct(0);
      if (result.success) {
        setAddMessage("Added: Digital Thermometer. Go to Products to view it.");
      } else {
        setAddMessage(`Error: ${result.error || "Failed to add product"}`);
      }
    } catch (err) {
      console.error("Error adding single product:", err);
      setAddMessage(`Error: ${err.message || "Failed to add product"}`);
    } finally {
      setAdding(false);
    }
  };

  const handleAddAllProducts = async () => {
    try {
      setAdding(true);
      setAddMessage("Adding sample products (about 12 items)...");
      const results = await addAllDummyProducts();
      const ok = results.filter(r => r.success).length;
      const fail = results.filter(r => !r.success).length;
      setAddMessage(`Added ${ok} products${fail ? `, ${fail} failed` : ""}. Go to Products to view them.`);
    } catch (err) {
      console.error("Error adding all products:", err);
      setAddMessage(`Error: ${err.message || "Failed to add products"}`);
    } finally {
      setAdding(false);
    }
  };

  // Featured products data
  const featuredProducts = [
    {
      id: 1,
      name: "Premium Vitamin C",
      price: 24.99,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      description: "Boost your immune system with our high-quality Vitamin C supplement."
    },
    {
      id: 2,
      name: "Digital Thermometer",
      price: 19.99,
      image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      description: "Accurate temperature readings in seconds with our digital thermometer."
    },
    {
      id: 3,
      name: "Blood Pressure Monitor",
      price: 49.99,
      image: "https://images.unsplash.com/photo-1631815588090-d1bcbe9a8545?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      description: "Monitor your health at home with our easy-to-use blood pressure device."
    },
    {
      id: 4,
      name: "Organic Hand Sanitizer",
      price: 8.99,
      image: "https://images.unsplash.com/photo-1584483720412-ce931f4aefa8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      description: "Keep germs away with our alcohol-based, gentle hand sanitizer."
    }
  ];

  // Categories
  const categories = [
    { name: "Medications", icon: "💊" },
    { name: "Vitamins & Supplements", icon: "🍏" },
    { name: "Personal Care", icon: "🧴" },
    { name: "Medical Devices", icon: "🩺" },
    { name: "First Aid", icon: "🩹" },
    { name: "Baby Care", icon: "👶" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to MediHaven</h1>
              <p className="text-xl mb-8">Your trusted online pharmacy for all your healthcare needs.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                {currentUser ? (
                  <>
                    <Link to="/products" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg transition duration-300 text-center">
                      Browse Products
                    </Link>
                    <Link to="/user-dashboard" className="bg-transparent hover:bg-blue-700 border border-white font-semibold py-3 px-6 rounded-lg transition duration-300 text-center">
                      Go to Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg transition duration-300 text-center">
                      Sign In
                    </Link>
                    <Link to="/register" className="bg-transparent hover:bg-blue-700 border border-white font-semibold py-3 px-6 rounded-lg transition duration-300 text-center">
                      Sign Up Now
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Pharmacy" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section - Show to all users */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 p-6 text-center cursor-pointer">
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="font-semibold text-gray-800">{category.name}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products - Show to all users */}
      <div className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-600">${product.price.toFixed(2)}</span>
                    {currentUser ? (
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300">
                        Add to Cart
                      </button>
                    ) : (
                      <Link to="/login" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300">
                        Sign in to Buy
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Call to action for non-logged in users */}
      {!currentUser && (
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Create an account to start shopping</h2>
            <p className="text-gray-600 mb-6">
              Sign in or create an account to purchase products and access your personal dashboard.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/login" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-300">
                Sign In
              </Link>
              <Link to="/register" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition duration-300">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Why Choose Us */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Why Choose MediHaven?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-blue-500 text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Get your medications delivered to your doorstep within 24 hours.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-blue-500 text-4xl mb-4">✓</div>
            <h3 className="text-xl font-semibold mb-2">Genuine Products</h3>
            <p className="text-gray-600">All our products are sourced directly from authorized manufacturers.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-blue-500 text-4xl mb-4">👨‍⚕️</div>
            <h3 className="text-xl font-semibold mb-2">Expert Consultation</h3>
            <p className="text-gray-600">Get free consultation from our team of healthcare professionals.</p>
          </div>
        </div>
      </div>

      {/* Database Seed Section (for admin users only) */}
      {currentUser && currentUser.role === "admin" && (
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Development Tools</h3>
            <p className="mb-4 text-gray-600">
              Add sample products and medicines to the database for testing purposes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleSeedDatabase}
                disabled={seeding}
                className={`${
                  seeding ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                } text-white px-6 py-2 rounded-lg font-semibold transition duration-300`}
              >
                {seeding ? "Seeding..." : "Seed Medicines (demo)"}
              </button>
              <button
                onClick={handleAddSingleProduct}
                disabled={adding}
                className={`${
                  adding ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                } text-white px-6 py-2 rounded-lg font-semibold transition duration-300`}
              >
                {adding ? "Adding..." : "Add 1 Dummy Product"}
              </button>
              <button
                onClick={handleAddAllProducts}
                disabled={adding}
                className={`${
                  adding ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                } text-white px-6 py-2 rounded-lg font-semibold transition duration-300`}
              >
                {adding ? "Adding..." : "Add 12 Dummy Products"}
              </button>
            </div>
            
            {seedMessage && (
              <div className={`mt-4 p-3 rounded-lg ${seedMessage.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {seedMessage}
              </div>
            )}
            {addMessage && (
              <div className={`mt-2 p-3 rounded-lg ${addMessage.includes("Error") ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                {addMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Newsletter */}
      <div className="bg-blue-500 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="mb-6 max-w-2xl mx-auto">Subscribe to our newsletter for the latest health tips, product updates, and exclusive offers.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-2 max-w-lg mx-auto">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="px-4 py-3 rounded-lg focus:outline-none text-gray-800 flex-grow"
            />
            <button className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold transition duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
