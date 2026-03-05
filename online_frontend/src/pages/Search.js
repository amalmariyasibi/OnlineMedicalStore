import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { searchProducts } from "../firebase";

function Search() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await searchProducts(query);
        if (result.success) {
          setResults(result.products);
        } else {
          setError(result.error || "Failed to fetch search results");
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("An error occurred while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for "{query}"
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            We couldn't find any products or medicines matching your search.
          </p>
          <div className="mt-6">
            <Link to="/" className="text-base font-medium text-blue-600 hover:text-blue-500">
              Go back to homepage
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-6">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>

          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {results.map((product) => {
              const isProduct = product.requiresPrescription === undefined;
              const linkPath = isProduct ? `/products/${product.id}` : `/medicines/${product.id}`;

              return (
                <Link key={product.id} to={linkPath} className="group">
                  <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
                    <img
                      src={product.imageUrl || "https://via.placeholder.com/300x300?text=No+Image"}
                      alt={product.name}
                      className="w-full h-full object-center object-cover group-hover:opacity-75"
                    />
                  </div>
                  <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <p className="mt-1 text-lg font-medium text-gray-900">₹{product.price.toFixed(2)}</p>
                    {product.requiresPrescription && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Prescription Required
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;