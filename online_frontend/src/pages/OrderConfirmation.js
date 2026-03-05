import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderById } from '../firebase';
// We'll handle cart operations separately without affecting the page loading state
import { useCart } from '../contexts/CartContextSimple';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addFullProductToCart } = useCart();
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log("Fetching order with ID:", orderId);
        const orderData = await getOrderById(orderId);
        console.log("Order data received:", orderData);
        
        if (orderData && orderData.success) {
          setOrder(orderData);
          
          // Add ordered items back to cart (separate from page loading)
          if (orderData.order && orderData.order.items) {
            console.log("Adding items to cart:", orderData.order.items);
            // We'll add items to cart in the background without affecting page loading
            setTimeout(async () => {
              try {
                // Add each item to the cart
                for (const item of orderData.order.items) {
                  try {
                    // Ensure item has all required properties
                    const productToAdd = {
                      id: item.id || item.productId,
                      name: item.name || 'Product',
                      price: Number(item.price) || 0,
                      quantity: Number(item.quantity) || 1,
                      requiresPrescription: Boolean(item.requiresPrescription) || false,
                      imageUrl: item.imageUrl || '',
                      ...item // Include any other properties
                    };
                    console.log("Adding product to cart:", productToAdd);
                    // We don't await this to avoid blocking the UI
                    addFullProductToCart(productToAdd, productToAdd.quantity);
                  } catch (addError) {
                    console.error('Failed to add item to cart:', item, addError);
                    // Continue with other items even if one fails
                  }
                }
              } catch (cartError) {
                console.error('Error adding items to cart:', cartError);
              }
            }, 0);
          }
        } else {
          setError(orderData?.error || 'Order not found');
        }
      } catch (err) {
        console.error("Order fetch error:", err);
        setError('Failed to load order details: ' + err.message);
      } finally {
        // Always set loading to false after fetching order data
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrder();
    } else {
      setError('No order ID provided');
      setLoading(false);
    }
  }, [orderId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !order || !order.success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-center text-lg font-medium text-gray-900">Error Loading Order</h3>
          <p className="mt-1 text-center text-sm text-gray-500">{error || "Order not found"}</p>
          <div className="mt-6">
            <Link
              to="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Safely extract order data with defaults
  const orderData = order.order || order;
  const subtotal = Number(orderData.subtotal ?? 0);
  const tax = Number(orderData.tax ?? 0);
  const delivery = Number(orderData.delivery ?? 0);
  const orderTotal = subtotal + tax + delivery;
  
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-green-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg leading-6 font-medium text-gray-900">Order Placed Successfully!</h3>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Thank you for your order. We've received your order and will begin processing it soon.
              </p>
              
              {/* Order Status */}
              <div className="mt-4 bg-white rounded-lg p-4">
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                  <span className="ml-2 text-sm text-gray-500">Your order is being processed</span>
                </div>
                
                {/* Simple status tracker */}
                <div className="mt-4">
                  <div className="relative">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div style={{ width: '0%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-center">
                        <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center mx-auto">
                          <span className="text-xs">1</span>
                        </div>
                        <span className="block mt-1 text-xs text-yellow-600 font-medium">Pending</span>
                      </div>
                      <div className="text-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center mx-auto">
                          <span className="text-xs">2</span>
                        </div>
                        <span className="block mt-1 text-xs text-gray-500">Approved</span>
                      </div>
                      <div className="text-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center mx-auto">
                          <span className="text-xs">3</span>
                        </div>
                        <span className="block mt-1 text-xs text-gray-500">Out for Delivery</span>
                      </div>
                      <div className="text-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center mx-auto">
                          <span className="text-xs">4</span>
                        </div>
                        <span className="block mt-1 text-xs text-gray-500">Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{orderData.id || orderId}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {orderData.createdAt ? formatDate(orderData.createdAt) : 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900">₹{(orderData.totalAmount !== undefined ? Number(orderData.totalAmount).toFixed(2) : orderTotal.toFixed(2))}</dd>
                </div>
                <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                   orderData.paymentMethod === 'card' ? 'Credit/Debit Card' : 
                   orderData.paymentMethod === 'upi' ? 'UPI' : orderData.paymentMethod || 'Not specified'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 mb-3">Order Summary</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between py-2">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Tax (18% GST)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Delivery</span>
                      <span>{delivery === 0 ? 'Free' : `₹${delivery.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold border-t border-gray-200 mt-2 pt-2">
                      <span>Total</span>
                       <span>₹{orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 mb-3">Order Items</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <ul className="divide-y divide-gray-200">
                    {orderData.items && orderData.items.map((item, index) => (
                      <li key={index} className="py-3 flex justify-between">
                        <div className="flex items-center">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="h-16 w-16 object-cover rounded mr-4" 
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Shipping Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {orderData.shippingAddress && (
                      <>
                        {orderData.shippingAddress.firstName} {orderData.shippingAddress.lastName}<br />
                        {orderData.shippingAddress.address}<br />
                        {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.pincode}<br />
                        Phone: {orderData.shippingAddress.phone}
                      </>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <h4 className="text-sm font-medium text-gray-500">Order Items</h4>
                <ul className="mt-4 divide-y divide-gray-200">
                  {orderData.items && orderData.items.map((item, index) => (
                    <li key={index} className="py-4 flex">
                      <div className="flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-sm font-medium text-gray-900">
                            <h5>{item.name}</h5>
                            <p className="ml-4">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                          </div>
                          <div className="mt-1 flex justify-between text-sm text-gray-500">
                            <p>Qty {item.quantity}</p>
                            <p>₹{(item.price || 0).toFixed(2)} each</p>
                          </div>
                          {item.requiresPrescription && (
                            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Prescription Required
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="flex justify-between text-sm font-medium text-gray-900">
                <p>Total</p>
                <p>₹{(orderData.totalAmount !== undefined ? Number(orderData.totalAmount).toFixed(2) : orderTotal.toFixed(2))}</p>
              </div>
              
              <div className="mt-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        You will receive an email confirmation shortly at {orderData.userEmail || 'your email'}.
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Your ordered items have been added back to your cart. <Link to="/cart" className="font-medium underline">View your cart</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;