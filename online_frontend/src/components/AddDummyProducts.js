import React, { useState } from 'react';
import { addAllDummyProducts, addSingleDummyProduct } from '../utils/addDummyProducts';

const AddDummyProducts = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleAddAllProducts = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const results = await addAllDummyProducts();
      setResults(results);
    } catch (err) {
      setError(err.message || 'An error occurred while adding products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingleProduct = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const result = await addSingleDummyProduct(0); // Add the first product
      setResults([result]);
    } catch (err) {
      setError(err.message || 'An error occurred while adding the product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Dummy Products</h2>
      <p className="text-gray-600 mb-6">
        This utility will add sample medical products to your store for testing purposes.
      </p>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={handleAddSingleProduct}
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Adding...' : 'Add Single Product (Test)'}
          </button>
          
          <button
            onClick={handleAddAllProducts}
            disabled={loading}
            className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Adding...' : 'Add All Products (12 items)'}
          </button>
        </div>

        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Adding products to Firebase...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
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

        {results && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Results</h3>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className={`flex items-center space-x-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  <span className="text-sm">
                    {result.success ? '✅' : '❌'} {result.product}
                  </span>
                  {result.error && <span className="text-xs text-red-600">({result.error})</span>}
                </div>
              ))}
            </div>
            
            {results.length > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Successfully added: {results.filter(r => r.success).length} / {results.length} products
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Sample Products Include:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Digital Thermometer</li>
          <li>• Blood Pressure Monitor</li>
          <li>• Pulse Oximeter</li>
          <li>• Paracetamol 500mg</li>
          <li>• Vitamin D3 Tablets</li>
          <li>• First Aid Kit</li>
          <li>• Hand Sanitizer</li>
          <li>• And 5 more medical products...</li>
        </ul>
      </div>
    </div>
  );
};

export default AddDummyProducts;
