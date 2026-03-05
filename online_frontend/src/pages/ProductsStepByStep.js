import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Products() {
  const navigate = useNavigate();
  const [testStep, setTestStep] = useState(0);
  
  // Mock data
  const products = [
    {
      id: '1',
      name: 'Test Product 1',
      price: 100,
      stockQuantity: 10,
      category: 'Test',
      imageUrl: 'https://placehold.co/300x300?text=Product1'
    }
  ];

  const testSteps = [
    {
      title: "Step 0: Navigation Test",
      action: () => {
        console.log('🚀 Testing navigation...');
        alert('🚀 Navigation test - going to cart');
        navigate('/cart');
      },
      buttonText: "Test Navigation"
    },
    {
      title: "Step 1: Auth Import Test", 
      action: async () => {
        try {
          console.log('🔐 Testing Auth import...');
          const { useAuth } = await import('../contexts/AuthContext');
          console.log('✅ Auth import successful');
          alert('✅ Auth import works!');
        } catch (error) {
          console.error('❌ Auth import failed:', error);
          alert('❌ Auth import failed: ' + error.message);
        }
      },
      buttonText: "Test Auth Import"
    },
    {
      title: "Step 2: Firebase Import Test",
      action: async () => {
        try {
          console.log('🔥 Testing Firebase import...');
          const { getAllProducts } = await import('../firebase');
          console.log('✅ Firebase import successful');
          alert('✅ Firebase import works!');
        } catch (error) {
          console.error('❌ Firebase import failed:', error);
          alert('❌ Firebase import failed: ' + error.message);
        }
      },
      buttonText: "Test Firebase Import"
    },
    {
      title: "Step 3: Firebase Function Call Test",
      action: async () => {
        try {
          console.log('📞 Testing Firebase function call...');
          const { getAllProducts } = await import('../firebase');
          const result = await getAllProducts();
          console.log('📞 Firebase call result:', result);
          alert('✅ Firebase call works! Got ' + (result.success ? result.products.length + ' products' : 'error: ' + result.error));
        } catch (error) {
          console.error('❌ Firebase call failed:', error);
          alert('❌ Firebase call failed: ' + error.message);
        }
      },
      buttonText: "Test Firebase Call"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Products (Step by Step Debug)</h1>
        
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            <strong>Debug Strategy:</strong> Test each import/function individually to find what's causing the loading issue.
          </p>
        </div>

        {/* Test buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {testSteps.map((step, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <button
                onClick={step.action}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                {step.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Product display */}
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 overflow-hidden lg:h-80 lg:aspect-none">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-center object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">₹{product.price}</p>
                </div>
                
                <div className="mt-2">
                  <span className="text-xs text-green-600">In Stock ({product.stockQuantity})</span>
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        console.log('🛒 Simple add to cart');
                        alert('🛒 This is a simple add to cart (no complex logic)');
                      }}
                      className="w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Simple Add to Cart
                    </button>
                  </div>
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
