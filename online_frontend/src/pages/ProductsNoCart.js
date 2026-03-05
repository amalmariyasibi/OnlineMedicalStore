import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAllProducts, getProductCategories } from "../firebase";

function Products() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carefully controlled useEffect
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        console.log('🔄 Starting to fetch products and categories...');
        setLoading(true);
        setError("");
        
        const [productsResult, categoriesResult] = await Promise.all([
          getAllProducts(),
          getProductCategories()
        ]);
        
        console.log('📦 Fetch results:', { productsResult, categoriesResult });
        
        if (isMounted) {
          if (productsResult.success) {
            console.log('✅ Products loaded:', productsResult.products.length);
            setProducts(productsResult.products);
          } else {
            console.error('❌ Products failed:', productsResult.error);
            setError(productsResult.error || "Failed to load products");
          }
          
          if (categoriesResult.success) {
            console.log('✅ Categories loaded:', categoriesResult.categories);
            setCategories(categoriesResult.categories);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Error in fetchData:', error);
        if (isMounted) {
          setError("An error occurred: " + error.message);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Simple add to cart handler (no CartContext)
  const handleAddToCart = (product) => {
    console.log('🛒 Add to Cart clicked for:', product.name);
    
    // Save to localStorage directly
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
    
    // Show success and navigate
    alert(`✅ ${product.name} added to cart!`);
    console.log('✅ Successfully added to cart and navigating...');
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products (No Cart Context)</h1>
          <div className="text-sm text-gray-600">
            {currentUser ? `Logged in as: ${currentUser.email}` : 'Not logged in'}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
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
                        <Link to={`/products/${product.id}`}>
                          <span aria-hidden="true" className="absolute inset-0" />
                          {product.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">₹{product.price}</p>
                  </div>
                  
                  <div className="mt-2">
                    {product.stockQuantity > 0 ? (
                      <span className="text-xs text-green-600">In Stock ({product.stockQuantity})</span>
                    ) : (
                      <span className="text-xs text-red-600">Out of Stock</span>
                    )}
                    {product.stockQuantity > 0 && currentUser && (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product);
                          }}
                          className="w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Add to Cart (No Context)
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
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
                          className="w-full bg-green-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Buy Now
                        </button>
                      </div>
                    )}
                    {!currentUser && product.stockQuantity > 0 && (
                      <div className="mt-2">
                        <Link
                          to="/login"
                          className="w-full bg-gray-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Login to Purchase
                        </Link>
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
