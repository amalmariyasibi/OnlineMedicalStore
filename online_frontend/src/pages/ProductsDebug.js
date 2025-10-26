import React from "react";
import { useNavigate } from "react-router-dom";

function Products() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Products Debug</h1>
        
        <div className="bg-white p-8 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Basic Button Test</h2>
          <button
            onClick={() => {
              console.log('✅ Basic button works!');
              alert('✅ Basic button works!');
            }}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 mr-4"
          >
            Test Basic Button
          </button>
          
          <button
            onClick={() => {
              console.log('✅ Navigate button works!');
              alert('✅ Navigate works! Going to cart...');
              navigate('/cart');
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Test Navigate
          </button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Import Tests</h2>
          <p className="text-sm text-gray-600 mb-4">Click each button to test different imports:</p>
          
          <button
            onClick={async () => {
              try {
                console.log('🧪 Testing Firebase import...');
                const { getAllProducts } = await import('../firebase');
                console.log('✅ Firebase import successful!');
                alert('✅ Firebase import works!');
              } catch (error) {
                console.error('❌ Firebase import failed:', error);
                alert('❌ Firebase import failed: ' + error.message);
              }
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mr-2 mb-2"
          >
            Test Firebase Import
          </button>

          <button
            onClick={async () => {
              try {
                console.log('🧪 Testing AuthContext import...');
                const { useAuth } = await import('../contexts/AuthContext');
                console.log('✅ AuthContext import successful!');
                alert('✅ AuthContext import works!');
              } catch (error) {
                console.error('❌ AuthContext import failed:', error);
                alert('❌ AuthContext import failed: ' + error.message);
              }
            }}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 mr-2 mb-2"
          >
            Test AuthContext Import
          </button>

          <button
            onClick={async () => {
              try {
                console.log('🧪 Testing CartContext import...');
                const { useCart } = await import('../contexts/CartContext');
                console.log('✅ CartContext import successful!');
                alert('✅ CartContext import works!');
              } catch (error) {
                console.error('❌ CartContext import failed:', error);
                alert('❌ CartContext import failed: ' + error.message);
              }
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mr-2 mb-2"
          >
            Test CartContext Import
          </button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Step 3: Hook Tests</h2>
          <p className="text-sm text-gray-600 mb-4">These will test actual hook usage:</p>
          
          <button
            onClick={() => {
              console.log('✅ React hooks work (they are used in this component already)!');
              alert('✅ React hooks work!');
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mr-2 mb-2"
          >
            React Hooks Work
          </button>
        </div>
      </div>
    </div>
  );
}

export default Products;
