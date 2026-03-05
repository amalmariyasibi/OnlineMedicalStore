import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAllProducts } from "../firebase";

function Products() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carefully controlled useEffect
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    const fetchProducts = async () => {
      try {
        console.log('🔄 Starting to fetch products...');
        setLoading(true);
        setError("");
        
        const result = await getAllProducts();
        console.log('📦 Products fetch result:', result);
        
        // Only update state if component is still mounted
        if (isMounted) {
          if (result.success) {
            console.log('✅ Products loaded successfully:', result.products.length, 'products');
            setProducts(result.products);
          } else {
            console.error('❌ Failed to load products:', result.error);
            setError(result.error || "Failed to load products");
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Error in fetchProducts:', error);
        if (isMounted) {
          setError("An error occurred while loading products: " + error.message);
          setLoading(false);
        }
      }
    };
    
    fetchProducts();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Filter products
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products from Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products (Step 2: + Firebase)</h1>
          <div className="text-sm text-gray-600">
            {currentUser ? `Logged in as: ${currentUser.email}` : 'Not logged in'}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Products count */}
        <div className="mb-4 text-sm text-gray-600">
          Found {filteredProducts.length} products
        </div>

        {/* Products grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                  <img
                    src={product.imageUrl || "https://placehold.co/300x300?text=No+Image"}
                    alt={product.name}
                    className="w-full h-full object-center object-cover lg:w-full lg:h-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://placehold.co/300x300?text=No+Image";
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">₹{product.price}</p>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-xs text-green-600">In Stock ({product.stockQuantity})</span>
                    {currentUser && (
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            console.log('✅ Add to Cart clicked for:', product.name);
                            alert(`${product.name} - Add to Cart clicked! (Step 2 with Firebase)`);
                            navigate('/cart');
                          }}
                          className="w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Add to Cart (Step 2)
                        </button>
                      </div>
                    )}
                    {!currentUser && (
                      <div className="mt-2">
                        <button
                          onClick={() => navigate('/login')}
                          className="w-full bg-gray-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Login to Purchase
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
