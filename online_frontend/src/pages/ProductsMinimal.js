import React from "react";

function Products() {
  // Mock data - no Firebase, no Auth, no Navigation
  const products = [
    {
      id: '1',
      name: 'Test Product 1',
      price: 100,
      stockQuantity: 10,
      category: 'Test',
      imageUrl: 'https://placehold.co/300x300?text=Product1'
    },
    {
      id: '2', 
      name: 'Test Product 2',
      price: 200,
      stockQuantity: 5,
      category: 'Test',
      imageUrl: 'https://placehold.co/300x300?text=Product2'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Products (Minimal Test)</h1>
        
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700">
            <strong>Debugging Test:</strong> This version has NO Firebase, NO Auth, NO Navigation, NO Context.
            If buttons don't work here, the issue is with React itself.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product) => (
            <div key={product.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-center object-cover lg:w-full lg:h-full"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">₹{product.price}</p>
                </div>
                
                <div className="mt-2">
                  <span className="text-xs text-green-600">In Stock ({product.stockQuantity})</span>
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => {
                        console.log('🔥 MINIMAL BUTTON CLICKED!');
                        alert('🔥 MINIMAL BUTTON WORKS! No loading should appear.');
                      }}
                      className="w-full bg-red-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      🔥 MINIMAL TEST BUTTON
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log('🛒 Add to Cart clicked (no action)');
                        alert('🛒 This would add to cart (but does nothing)');
                      }}
                      className="w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add to Cart (Minimal)
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log('🚀 Navigation test');
                        alert('🚀 This would navigate (but does nothing)');
                      }}
                      className="w-full bg-green-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Navigation Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 bg-blue-100 border-l-4 border-blue-500 p-4">
          <p className="text-blue-700">
            <strong>Expected behavior:</strong> All buttons should show alerts immediately with NO loading spinner.
            If any button shows loading, there's a fundamental React/JavaScript issue.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Products;
