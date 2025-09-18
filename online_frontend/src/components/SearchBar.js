import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchProducts } from "../firebase";

function SearchBar({ className }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Add click outside listener to close results
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          console.log("SearchBar: Searching for:", query);
          const result = await searchProducts(query);
          if (result.success) {
            console.log("SearchBar: Search results:", result.products);
            setResults(result.products);
            setShowResults(true);
          } else {
            console.error("SearchBar: Search failed:", result.error);
          }
        } catch (error) {
          console.error("SearchBar: Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };

  const handleResultClick = (productId, type) => {
    navigate(`/${type}/${productId}`);
    setShowResults(false);
    setQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicines and products..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-white shadow-lg rounded-md overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {results.map((product) => (
              <div
                key={product.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => 
                  handleResultClick(
                    product.id, 
                    product.requiresPrescription !== undefined ? "medicines" : "products"
                  )
                }
              >
                <div className="h-10 w-10 flex-shrink-0 mr-3">
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/40x40?text=No+Image"}
                    alt={product.name}
                    className="h-full w-full object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {product.category} • ₹{product.price.toFixed(2)}
                  </p>
                </div>
                {product.requiresPrescription && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Rx
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <button
              onClick={handleSearch}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all results for "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;