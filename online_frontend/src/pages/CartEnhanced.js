import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Cart() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart items from localStorage
    const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
    const savedCart = localStorage.getItem(cartKey);
    
    console.log('🛒 CartEnhanced - Loading cart:');
    console.log('🔑 Cart key:', cartKey);
    console.log('💾 Saved cart:', savedCart);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('📦 Parsed cart:', parsedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart:', error);
        setCartItems([]);
      }
    } else {
      console.log('❌ No saved cart found');
      setCartItems([]);
    }
    
    setLoading(false);
  }, [currentUser]);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }

    const updatedItems = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    
    setCartItems(updatedItems);
    
    // Save to localStorage
    const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
    localStorage.setItem(cartKey, JSON.stringify(updatedItems));
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    setCartItems(updatedItems);
    
    // Save to localStorage
    const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
    if (updatedItems.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(updatedItems));
    } else {
      localStorage.removeItem(cartKey);
    }
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCart = () => {
    setCartItems([]);
    const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
    localStorage.removeItem(cartKey);
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1 text-sm text-gray-500">Start shopping to add items to your cart.</p>
            <div className="mt-6">
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">My Cart ({itemCount} items)</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={item.imageUrl || "https://placehold.co/300x300?text=No+Image"}
                            alt={item.name}
                            className="w-full h-full object-center object-cover"
                          />
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-gray-900 mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                          
                          {/* Price */}
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xl font-bold text-gray-900">₹{item.price}</span>
                            <span className="text-sm text-gray-500">per item</span>
                          </div>
                          
                          {/* Quantity and Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-700">Qty:</span>
                              <select
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <option key={num} value={num}>
                                    {num}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <button
                                type="button"
                                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                              >
                                SAVE FOR LATER
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                              >
                                REMOVE
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg sticky top-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">PRICE DETAILS</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price ({itemCount} items)</span>
                    <span className="text-gray-900">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-gray-900">Total Amount</span>
                      <span className="text-gray-900">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-green-600 font-medium">
                    You will save ₹0 on this order
                  </div>
                </div>
                
                <div className="px-6 pb-6">
                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-md transition duration-200 mb-3"
                  >
                    PLACE ORDER
                  </button>
                  
                  <button
                    onClick={clearCart}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                  >
                    CLEAR CART
                  </button>
                </div>
              </div>
              
              {/* Continue Shopping */}
              <div className="mt-6 text-center">
                <Link
                  to="/products"
                  className="text-blue-600 hover:text-blue-500 font-medium text-sm"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
