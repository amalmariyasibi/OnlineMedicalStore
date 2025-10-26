import React from "react";
import { useNavigate } from "react-router-dom";

function Products() {
  const navigate = useNavigate();
  
  // Mock data for testing
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
  
  const currentUser = { email: 'test@test.com' }; // Mock user

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Products</h1>
        
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
                  {currentUser && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          alert(`${product.name} - Add to Cart clicked!`);
                          navigate('/cart');
                        }}
                        className="w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add to Cart
                      </button>
                    </div>
                  )}
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
