import React from 'react';

function ProductsSimple() {
  const handleClick = () => {
    alert('Simple button works!');
    console.log('Simple button clicked!');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Products Test</h1>
        
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Button Test</h2>
          <button
            onClick={handleClick}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductsSimple;
