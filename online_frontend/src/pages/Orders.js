import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Import the getUserOrders function instead of direct Firestore functions
import { getUserOrders } from '../firebase';

const Orders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect admin users to the admin dashboard
    if (currentUser?.role === 'admin') {
      navigate('/admin');
      return;
    }

    // Redirect delivery users to the delivery dashboard
    if (currentUser?.role === 'delivery') {
      navigate('/delivery');
      return;
    }

    const fetchOrders = async () => {
      try {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Use the getUserOrders function instead of direct query
        const ordersResult = await getUserOrders(currentUser.uid);
        
        if (ordersResult.success) {
          const ordersData = ordersResult.orders.map(order => {
            // Handle date conversion more robustly
            let createdAtFormatted = 'Unknown date';
            let updatedAtFormatted = null;
            
            if (order.createdAt) {
              if (typeof order.createdAt.toDate === 'function') {
                // Firestore Timestamp
                createdAtFormatted = order.createdAt.toDate().toLocaleString();
              } else if (order.createdAt instanceof Date) {
                // JavaScript Date
                createdAtFormatted = order.createdAt.toLocaleString();
              } else if (typeof order.createdAt === 'string') {
                // String date
                createdAtFormatted = new Date(order.createdAt).toLocaleString();
              } else {
                // Fallback
                createdAtFormatted = order.createdAt.toString();
              }
            }
            
            if (order.updatedAt) {
              if (typeof order.updatedAt.toDate === 'function') {
                // Firestore Timestamp
                updatedAtFormatted = order.updatedAt.toDate().toLocaleString();
              } else if (order.updatedAt instanceof Date) {
                // JavaScript Date
                updatedAtFormatted = order.updatedAt.toLocaleString();
              } else if (typeof order.updatedAt === 'string') {
                // String date
                updatedAtFormatted = new Date(order.updatedAt).toLocaleString();
              } else {
                // Fallback
                updatedAtFormatted = order.updatedAt.toString();
              }
            }
            
            return {
              id: order.id,
              ...order,
              createdAt: createdAtFormatted,
              updatedAt: updatedAtFormatted
            };
          });

          setOrders(ordersData);
          setError(null);
        } else {
          console.error('Error fetching orders:', ordersResult.error);
          setError('Failed to load orders. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser, navigate]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out for delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'out for delivery':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-red-800">{error}</h3>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and track all your orders
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start shopping to see your orders here.
          </p>
          <div className="mt-6">
            <Link
              to="/medicines"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Start Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={order.id}>
                <Link to={`/orders/${order.id}`} className="block hover:bg-gray-50 transition duration-150 ease-in-out">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            Order #{order.id.substring(0, 8)}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-2">
                                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {order.createdAt}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              {order.items?.length || 0} item(s)
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p className="font-semibold text-gray-900">
                              ₹{order.totalAmount?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center space-x-2">
                              {order.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex-shrink-0">
                                  {item.imageUrl ? (
                                    <img className="h-10 w-10 rounded object-cover" src={item.imageUrl} alt={item.name} />
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <span className="text-sm text-gray-500">
                                  +{order.items.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="ml-5 flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Orders;