import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAllProducts } from "../firebase";

function Products({ title = "Products" }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false
  const [error, setError] = useState("");

  // Simple, controlled useEffect
  useEffect(() => {
    console.log('🔄 useEffect triggered');
    
    const fetchProducts = async () => {
      try {
        console.log('📦 Starting fetch...');
        setLoading(true);
        
        const result = await getAllProducts();
        console.log('📦 Fetch completed:', result);
        
        if (result.success) {
          setProducts(result.products);
          console.log('✅ Products set:', result.products.length);
        } else {
          setError(result.error);
          console.log('❌ Error set:', result.error);
        }
      } catch (error) {
        console.error('💥 Catch error:', error);
        setError(error.message);
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Empty dependency array

  console.log('🎨 Render - loading:', loading, 'products:', products.length, 'error:', error);

  const handleAddToCart = (product) => {
    console.log('🛒 Add to cart clicked:', product.name);
    
    // Save to localStorage
    const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
    const existingCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    // Check if product already exists
    const existingIndex = existingCart.findIndex(item => item.id === product.id);
    
    if (existingIndex >= 0) {
      // Update quantity
      existingCart[existingIndex].quantity += 1;
    } else {
      // Add new item
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        category: product.category,
        imageUrl: product.imageUrl
      });
    }
    
    localStorage.setItem(cartKey, JSON.stringify(existingCart));
    
    // Trigger cart update event for same-tab updates
    window.dispatchEvent(new Event('cartUpdated'));
    
    alert(`✅ ${product.name} added to cart!`);
    navigate('/cart');
  };

  if (loading) {
    console.log('⏳ Showing loading state');
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Showing main content');
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <div className="text-sm text-gray-600">
            {currentUser ? `Logged in as: ${currentUser.email}` : 'Not logged in'}
          </div>
        </div>


        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div
                className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none cursor-pointer"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <img
                  src={product.imageUrl || "https://placehold.co/300x300?text=No+Image"}
                  alt={product.name}
                  className="w-full h-full object-center object-cover lg:w-full lg:h-full"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3
                      className="text-sm font-medium text-gray-900 cursor-pointer hover:underline"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
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
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => {
                            const buyNowItem = {
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              quantity: 1,
                              category: product.category,
                              requiresPrescription: product.requiresPrescription || false,
                              imageUrl: product.imageUrl || "",
                            };
                            navigate("/checkout", { state: { buyNowItem } });
                          }}
                          className="w-full bg-orange-500 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          Buy Now
                        </button>
                      </div>
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
      </div>
    </div>
  );
}

export default Products;
