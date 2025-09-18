import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchProducts } from "../firebase";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [productType, setProductType] = useState("all"); // "all", "medicines", "products"
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance"); // "relevance", "priceLow", "priceHigh", "newest"

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(""); // Clear previous errors
        console.log("Searching for:", query);
        const result = await searchProducts(query);
        
        if (result.success) {
          console.log("Search results:", result.products);
          setResults(result.products);
        } else {
          console.error("Search error:", result.error);
          setError(result.error || "Failed to load search results");
          
          // If it's an offline error, we might want to retry
          if (result.isOffline) {
            console.log("Offline error detected, will retry when online");
          }
        }
      } catch (err) {
        console.error("Search exception:", err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    
    // Add an online/offline event listener to retry when connection is restored
    const handleOnline = () => {
      console.log("Connection restored, retrying search...");
      if (error && (error.includes("offline") || error.includes("internet"))) {
        fetchResults();
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [query, error]);

  // Apply filters and sorting
  const filteredResults = results.filter(product => {
    // Category filter
    if (selectedCategory !== "all" && product.category !== selectedCategory) {
      return false;
    }
    
    // Product type filter
    if (productType === "medicines" && product.requiresPrescription === undefined) {
      return false;
    }
    if (productType === "products" && product.requiresPrescription !== undefined) {
      return false;
    }
    
    // In stock filter
    if (inStockOnly && product.stockQuantity <= 0) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    switch (sortBy) {
      case "priceLow":
        return a.price - b.price;
      case "priceHigh":
        return b.price - a.price;
      case "newest":
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      default:
        // "relevance" - no specific sorting, use default
        return 0;
    }
  });

  // Extract unique categories from results
  const categories = ["all", ...new Set(results.map(product => product.category))];

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Search Results for "{query}"
        </h1>
        <p className="mt-4 text-gray-500">
          {filteredResults.length} results found
        </p>

        {/* Filters */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Product type filter */}
            <div>
              <label htmlFor="productType" className="block text-sm font-medium text-gray-700">
                Product Type
              </label>
              <select
                id="productType"
                name="productType"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="medicines">Medicines</option>
                <option value="products">Health Products</option>
              </select>
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
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
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
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* In stock filter */}
            <div className="flex items-center">
              <input
                id="inStock"
                name="inStock"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">
                In Stock Only
              </label>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className={`mt-6 ${error.includes("offline") || error.includes("internet") ? "bg-yellow-50 border-yellow-400" : "bg-red-50 border-red-400"} border-l-4 p-4`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {error.includes("offline") || error.includes("internet") ? (
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${error.includes("offline") || error.includes("internet") ? "text-yellow-700" : "text-red-700"}`}>
                  {error}
                </p>
                {(error.includes("offline") || error.includes("internet")) && (
                  <div className="mt-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm font-medium text-yellow-700 hover:text-yellow-600"
                    >
                      Retry
                    </button>
                  </div>
                )}
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
            {/* Results grid */}
            {filteredResults.length === 0 ? (
              <div className="mt-12 text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
              </div>
            ) : (
              <div className="mt-12 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                {filteredResults.map((product) => (
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
                            <Link to={`/${product.requiresPrescription !== undefined ? "medicines" : "products"}/${product.id}`}>
                              <span aria-hidden="true" className="absolute inset-0" />
                              {product.name}
                            </Link>
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                          {product.requiresPrescription && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Prescription
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">₹{product.price.toFixed(2)}</p>
                      </div>
                      <div className="mt-2">
                        {product.stockQuantity > 0 ? (
                          <span className="text-xs text-green-600">In Stock ({product.stockQuantity})</span>
                        ) : (
                          <span className="text-xs text-red-600">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchResults;