import React, { useState } from 'react';
import { addAllDummyProducts } from '../utils/addDummyProducts';

const AddProductsButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddProducts = async () => {
    setLoading(true);
    setMessage('Adding products to database...');
    
    try {
      const results = await addAllDummyProducts();
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      setMessage(`✅ Added ${successful} products successfully! ${failed > 0 ? `(${failed} failed)` : ''}`);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <button
          onClick={handleAddProducts}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Adding Products...' : 'Add Sample Products'}
        </button>
        {message && (
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export default AddProductsButton;
