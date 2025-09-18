import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllProducts, getProductCategories } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("featured"); // "featured", "priceLow", "priceHigh", "newest"

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResult = await getProductCategories();
        if (categoriesResult.success) {
          setCategories(categoriesResult.categories);
        }
        
        // Fetch products with filters
        const filters = {
          category: selectedCategory === "all" ? null : selectedCategory,
          searchTerm: searchTerm,
          inStock: inStockOnly ? true : undefined
        };
        
        const result = await getAllProducts(filters);
        if (result.success) {
          let filteredProducts = result.products;
          
          // Apply price range filter (client-side)
          if (priceRange.min !== "") {
            filteredProducts = filteredProducts.filter(product => 
              product.price >= parseFloat(priceRange.min)
            );
          }
          
          if (priceRange.max !== "") {
            filteredProducts = filteredProducts.filter(product => 
              product.price <= parseFloat(priceRange.max)
            );
          }
          
          // Apply sorting
          switch (sortBy) {
            case "priceLow":
              filteredProducts.sort((a, b) => a.price - b.price);
              break;
            case "priceHigh":
              filteredProducts.sort((a, b) => b.price - a.price);
              break;
            case "newest":
              filteredProducts.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
              });
              break;
            default:
              // "featured" - no specific sorting, use default
              break;
          }
          
          setProducts(filteredProducts);
          setError("");
        } else {
          setError(result.error || "Failed to load products");
        }
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, [selectedCategory, searchTerm, inStockOnly, priceRange, sortBy]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleInStockChange = (e) => {
    setInStockOnly(e.target.checked);
  };
  
  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Health & Wellness Products</h1>
        <p className="mt-4 max-w-xl text-sm text-gray-700">
          Browse our wide selection of healthcare accessories, equipment, and wellness products
        </p>

        {/* Filters */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Category filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <select
                id="sortBy"
                name="sortBy"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="featured">Featured</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Price Range (₹)
              </label>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    name="min"
                    placeholder="Min"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={priceRange.min}
                    onChange={handlePriceRangeChange}
                    min="0"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="max"
                    placeholder="Max"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={priceRange.max}
                    onChange={handlePriceRangeChange}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox filters */}
            <div className="sm:col-span-2 flex flex-col space-y-4">
              <div className="flex items-center">
                <input
                  id="inStock"
                  name="inStock"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={inStockOnly}
                  onChange={handleInStockChange}
                />
                <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">
                  In Stock Only
                </label>
              </div>
            </div>
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

        {/* Loading state */}
        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Product grid */}
            {products.length === 0 ? (
              <div className="mt-12 text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
              </div>
            ) : (
              <>
                {/* Product count */}
                <div className="mt-6">
                  <p className="text-sm text-gray-500">{products.length} products found</p>
                </div>
                
                {/* Product grid */}
                <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                  {products.map((product) => (
                    <div key={product.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                        <img
                          src={product.imageUrl || "https://via.placeholder.com/300x300?text=No+Image"}
                          alt={product.name}
                          className="w-full h-full object-center object-cover lg:w-full lg:h-full"
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
                          <p className="text-sm font-medium text-gray-900">₹{product.price.toFixed(2)}</p>
                        </div>
                        <div className="mt-2">
                          {product.stockQuantity > 0 ? (
                            <span className="text-xs text-green-600">In Stock ({product.stockQuantity})</span>
                          ) : (
                            <span className="text-xs text-red-600">Out of Stock</span>
                          )}
                          {product.stockQuantity > 0 && (
                            currentUser ? (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  addToCart(product, 1);
                                  alert(`${product.name} added to cart!`);
                                }}
                                className="mt-2 w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Add to Cart
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate('/login', { state: { from: '/products' } });
                                }}
                                className="mt-2 w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Sign in to Buy
                              </button>
                            )
                          )}
                        </div>
                        {product.isNew && (
                          <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          </div>
                        )}
                        {product.isPopular && (
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Popular
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Products;