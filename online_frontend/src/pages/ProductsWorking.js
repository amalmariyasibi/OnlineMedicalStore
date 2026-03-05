import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllProducts, getProductCategories } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch products and categories in parallel
        const [productsResult, categoriesResult] = await Promise.all([
          getAllProducts(),
          getProductCategories()
        ]);
        
        if (productsResult.success) {
          setProducts(productsResult.products);
        } else {
          setError(productsResult.error || "Failed to load products");
        }
        
        if (categoriesResult.success) {
          setCategories(categoriesResult.categories);
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("An error occurred while loading products");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductsAndCategories();
  }, []);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
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

        {/* Error message */}
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
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
                            // Simple navigation to cart for now - will add cart functionality later
                            alert(`${product.name} - Add to Cart clicked! (Cart functionality will be added next)`);
                            navigate('/cart');
                          }}
                          className="w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Add to Cart
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
