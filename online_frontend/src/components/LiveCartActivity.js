import React, { useState, useEffect } from 'react';

function LiveCartActivity() {
  const [cartActivities, setCartActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate getting cart activities from localStorage of all users
    // In a real app, this would come from a Firebase collection
    const getCartActivities = () => {
      const activities = [];
      
      // Check all localStorage keys for cart data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cart_')) {
          try {
            const cartData = JSON.parse(localStorage.getItem(key));
            if (cartData && cartData.length > 0) {
              const userId = key.replace('cart_', '');
              const itemCount = cartData.reduce((total, item) => total + item.quantity, 0);
              const cartValue = cartData.reduce((total, item) => total + (item.price * item.quantity), 0);
              
              activities.push({
                id: key,
                userId: userId === 'guest' ? 'Guest User' : userId,
                items: cartData,
                itemCount,
                cartValue,
                lastUpdated: new Date().toISOString(), // In real app, this would be stored
                status: 'active'
              });
            }
          } catch (error) {
            console.error('Error parsing cart data:', error);
          }
        }
      }
      
      return activities;
    };

    const activities = getCartActivities();
    setCartActivities(activities);
    setLoading(false);

    // Update every 30 seconds
    const interval = setInterval(() => {
      const updatedActivities = getCartActivities();
      setCartActivities(updatedActivities);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Live Cart Activity</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Live Cart Activity</h3>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      {cartActivities.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active carts</h3>
          <p className="mt-1 text-sm text-gray-500">No users currently have items in their cart.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Active Carts</p>
                  <p className="text-2xl font-semibold text-blue-900">{cartActivities.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Total Items</p>
                  <p className="text-2xl font-semibold text-green-900">
                    {cartActivities.reduce((total, cart) => total + cart.itemCount, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Potential Revenue</p>
                  <p className="text-2xl font-semibold text-yellow-900">
                    ₹{cartActivities.reduce((total, cart) => total + cart.cartValue, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Cart Details</h4>
            {cartActivities.map((cart) => (
              <div key={cart.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{cart.userId}</p>
                      <p className="text-xs text-gray-500">
                        {cart.itemCount} items • ₹{cart.cartValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {cart.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <img
                          src={item.imageUrl || "https://placehold.co/40x40?text=Item"}
                          alt={item.name}
                          className="w-8 h-8 rounded object-cover mr-3"
                        />
                        <span className="text-gray-900">{item.name}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        <span className="ml-2">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {cart.items.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{cart.items.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveCartActivity;
