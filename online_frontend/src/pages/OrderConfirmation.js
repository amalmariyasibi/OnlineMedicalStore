import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderById } from "../firebase";

function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const result = await getOrderById(orderId);
        
        if (result.success) {
          setOrder(result.order);
          setError("");
        } else {
          setError(result.error || "Failed to load order details");
        }
      } catch (err) {
        console.error("Order fetch error:", err);
        setError('Failed to load order details: ' + err.message);
      } finally {
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
  
  if (error || !order) {
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
  // Calculate total if not available
  const orderTotal = order.totalAmount || 
    (order.subtotal ? 
      (order.subtotal + (order.tax || 0) + (order.delivery || 0)) : 
      (order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0));
  
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
                  <dd className="mt-1 text-sm text-gray-900">{order.id}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {order.createdAt ? new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : 
                     order.paymentMethod === "card" ? "Credit/Debit Card" : 
                     order.paymentMethod === "upi" ? "UPI" : order.paymentMethod}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Shipping Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                    {order.shippingAddress.address}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
                    Phone: {order.shippingAddress.phone}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <h4 className="text-sm font-medium text-gray-500">Order Items</h4>
                <ul className="mt-4 divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-4 flex">
                      <div className="flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-sm font-medium text-gray-900">
                            <h5>{item.name}</h5>
                            <p className="ml-4">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <div className="mt-1 flex justify-between text-sm text-gray-500">
                            <p>Qty {item.quantity}</p>
                            <p>₹{item.price.toFixed(2)} each</p>
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
                <p>₹{(order.totalAmount || orderTotal).toFixed(2)}</p>
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
                        You will receive an email confirmation shortly at {order.userEmail}.
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