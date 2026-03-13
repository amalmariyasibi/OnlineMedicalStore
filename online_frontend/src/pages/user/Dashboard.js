import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Mark component as mounted to prevent state updates on unmounted component
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
          if (isMountedRef.current) {
            setLoading(false);
          }
          return;
        }

        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(ordersQuery);
        
        if (!isMountedRef.current) return;
        
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || 'Unknown date'
        }));

        // Successfully fetched data (even if empty)
        setOrders(ordersData);
        setError(null); // Clear any previous errors
      } catch (err) {
        // Only log the error but don't display it to the user
        // This way the UI will just show an empty state
        console.error('Error fetching orders:', err);
        if (isMountedRef.current) {
          setOrders([]);
          setError(null);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
  }, [currentUser, navigate]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
      
      {/* User Info Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <div className="mr-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{currentUser?.displayName || 'User'}</h2>
            <p className="text-gray-600">{currentUser?.email}</p>
            {currentUser?.role && (
              <p className="text-sm text-blue-600 mt-1">
                Role: {currentUser.role}
                {currentUser.role === 'admin' && (
                  <Link to="/admin" className="ml-3 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">
                    Go to Admin Dashboard
                  </Link>
                )}
                {currentUser.role === 'delivery' && (
                  <Link to="/delivery" className="ml-3 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs">
                    Go to Delivery Dashboard
                  </Link>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Link to="/profile" className="bg-white shadow rounded-lg p-6 hover:bg-blue-50 transition duration-200">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">My Profile</h3>
              <p className="text-sm text-gray-500">View and edit your profile</p>
            </div>
          </div>
        </Link>
        
        <Link to="/cart" className="bg-white shadow rounded-lg p-6 hover:bg-blue-50 transition duration-200">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">My Cart</h3>
              <p className="text-sm text-gray-500">View your shopping cart</p>
            </div>
          </div>
        </Link>
        
        <Link to="/medicines" className="bg-white shadow rounded-lg p-6 hover:bg-blue-50 transition duration-200">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Shop Medicines</h3>
              <p className="text-sm text-gray-500">Browse our medicine catalog</p>
            </div>
          </div>
        </Link>
        
        <Link to="/find-medicine" className="bg-white shadow rounded-lg p-6 hover:bg-blue-50 transition duration-200">
          <div className="flex items-center">
            <div className="rounded-full bg-cyan-100 p-3 mr-4">
              <svg className="h-6 w-6 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Find Medicine</h3>
              <p className="text-sm text-gray-500">Search medicines by disease or symptom</p>
            </div>
          </div>
        </Link>
        
        <Link to="/health-profile" className="bg-white shadow rounded-lg p-6 hover:bg-blue-50 transition duration-200">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <svg className="h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Health Profile &amp; Diet Management</h3>
              <p className="text-sm text-gray-500">View AI health recommendations and diet insights</p>
            </div>
          </div>
        </Link>
        
        <Link to="/health-assistant" className="bg-white shadow rounded-lg p-6 hover:bg-blue-50 transition duration-200">
          <div className="flex items-center">
            <div className="rounded-full bg-indigo-100 p-3 mr-4">
              <svg className="h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">AI Health Assistant</h3>
              <p className="text-sm text-gray-500">Get symptom analysis and health advice</p>
            </div>
          </div>
        </Link>
        
        <Link to="/orders" className="bg-white shadow rounded-lg p-6 hover:bg-blue-50 transition duration-200">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">My Orders</h3>
              <p className="text-sm text-gray-500">Track and view your orders</p>
            </div>
          </div>
        </Link>
        
        <Link to="/prescriptions" className="bg-white shadow rounded-lg p-6 hover:bg-blue-50 transition duration-200">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">My Prescriptions</h3>
              <p className="text-sm text-gray-500">Manage your medical prescriptions</p>
            </div>
          </div>
        </Link>
      </div>
      
      {/* AI Scanner Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Specialized AI Features</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">
            Innovative healthcare tools designed to make life easier for you and your family.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* AI Strip Scanner Card */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start mb-4">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-bold text-gray-900 mr-2">AI Strip Scanner</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                    NEW
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded ml-1">
                    ELDERLY FRIENDLY
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Upload a photo of your medicine strip. Our AI identifies it and adds to your cart automatically.
                </p>
                <Link
                  to="/medicine-scanner"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Start AI Scanning →
                </Link>
              </div>
            </div>
          </div>

          {/* Rx Expert Scanner Card */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start">
              <div className="bg-purple-100 rounded-full p-3 mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Rx Expert Scanner</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Advanced OCR for doctor's handwritten prescriptions. Extracts dosage, strength, and matching medicines.
                </p>
                <Link
                  to="/prescription-scanner"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Scan Prescription →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link to="/orders" className="text-blue-600 hover:text-blue-800 text-sm">
            View All Orders →
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No orders to display.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{order.totalAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          order.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                          order.status === 'out for delivery' ? 'bg-purple-100 text-purple-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link to={`/orders/${order.id}`} className="text-blue-600 hover:text-blue-900">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;