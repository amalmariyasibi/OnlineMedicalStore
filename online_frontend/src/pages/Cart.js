import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContextSimple";

function Cart() {
  const { 
    items, 
    loading, 
    error, 
    cartTotal, 
    prescriptionRequired,
    removeFromCart, 
    updateQuantity, 
    clearCart 
  } = useCart();
  
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const navigate = useNavigate();
  
  const handleQuantityChange = async (id, newQuantity) => {
    await updateQuantity(id, parseInt(newQuantity));
  };
  
  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };
  
  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrescriptionFile(file);
    }
  };
  
  const handleCheckout = () => {
    // For prescription items, check if prescription is uploaded
    if (prescriptionRequired && !prescriptionFile) {
      alert("Please upload a prescription for prescription medicines");
      return;
    }
    
    // Navigate to checkout page
    navigate("/checkout");
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Shopping Cart</h1>
        
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
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
        
        {items.length === 0 ? (
          <div className="mt-12 text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1 text-sm text-gray-500">Start shopping to add items to your cart.</p>
            <div className="mt-6">
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-12">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
              <div className="lg:col-span-7">
                <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                  {items.map((item) => (
                    <div key={item.id} className="py-6 flex">
                      <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                        <img
                          src={item.imageUrl || "https://placehold.co/96x96?text=No+Image"}
                          alt={item.name}
                          className="w-full h-full object-center object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://placehold.co/96x96?text=No+Image";
                          }}
                        />
                      </div>
                      
                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>
                              <Link to={`/${item.requiresPrescription !== undefined ? "medicines" : "products"}/${item.id}`}>
                                {item.name}
                              </Link>
                            </h3>
                            <p className="ml-4">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                          {item.requiresPrescription && (
                            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Prescription Required
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <div className="flex items-center">
                            <label htmlFor={`quantity-${item.id}`} className="mr-2 text-gray-500">
                              Qty
                            </label>
                            <select
                              id={`quantity-${item.id}`}
                              name={`quantity-${item.id}`}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className="max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              {[...Array(Math.min(10, item.stockQuantity)).keys()].map((i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex">
                            <button
                              type="button"
                              className="font-medium text-blue-600 hover:text-blue-500"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
              
              <div className="mt-16 lg:mt-0 lg:col-span-5">
                <div className="bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8">
                  <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Subtotal</div>
                      <div className="text-sm font-medium text-gray-900">₹{cartTotal.toFixed(2)}</div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="text-base font-medium text-gray-900">Order total</div>
                      <div className="text-base font-medium text-gray-900">₹{cartTotal.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {prescriptionRequired && (
                    <div className="mt-6">
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              Prescription required for some items in your cart
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Upload Prescription
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="prescription-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="prescription-upload"
                                  name="prescription-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*,.pdf"
                                  onChange={handlePrescriptionUpload}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, PDF up to 10MB
                            </p>
                          </div>
                        </div>
                        {prescriptionFile && (
                          <p className="mt-2 text-sm text-green-600">
                            File selected: {prescriptionFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                      or{" "}
                      <Link to="/products" className="font-medium text-blue-600 hover:text-blue-500">
                        Continue Shopping
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;