import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getUserData, getDeliveryOrders, updateOrderStatus, requestAndSaveFcmToken, onForegroundNotification } from "../firebase";
import DeliveryMapPanel from "../components/DeliveryMapPanel";

function DeliveryDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned');
  const [selectedForUpdate, setSelectedForUpdate] = useState(null);
  const [selectedForOtp, setSelectedForOtp] = useState(null);
  const [mapOrder, setMapOrder] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Fetch user data and orders
  const fetchUserAndOrders = async () => {
    try {
      setLoading(true);
      setError("");
      
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate("/login");
        return;
      }

      // Get user data to verify role
      const userDataResult = await getUserData(currentUser.uid);
      if (!userDataResult.success || !userDataResult.data) {
        console.error("Failed to fetch user data:", userDataResult.error);
        navigate("/unauthorized");
        return;
      }

      // Normalize role for delivery users
      let userRole = userDataResult.data.role ? userDataResult.data.role.toString().trim().toLowerCase() : "";
      if (userRole === "delivery boy" || userRole === "deliveryboy") {
        userRole = "delivery";
      }

      if (userRole !== "delivery") {
        console.warn("User is not a delivery person. Role:", userRole);
        navigate("/unauthorized");
        return;
      }

      setUser(currentUser);
      setUserData(userDataResult.data);
      
      // Fetch orders assigned to this delivery person
      try {
        const result = await getDeliveryOrders(currentUser.uid);
        
        if (result.success) {
          setOrders(result.orders);
        } else {
          // Check if the error is related to missing index
          if (result.error && result.error.includes("index")) {
            setError("Database index is being created. This may take a few minutes. Please refresh the page shortly.");
          } else {
            setError(result.error || "Failed to load orders");
          }
        }
      } catch (fetchError) {
        // Handle specific Firebase index error
        if (fetchError.message && fetchError.message.includes("index")) {
          setError(
            "The system is setting up the database for first use. Please follow these steps:" +
            "\n1. Click the link below to create the required index" +
            "\n2. Sign in to your Firebase account if prompted" +
            "\n3. Click 'Create index' on the Firebase page" +
            "\n4. Wait for the index to be created (usually 1-2 minutes)" +
            "\n5. Return to this page and refresh"
          );
        } else {
          setError("Failed to load orders: " + fetchError.message);
        }
      }
    } catch (err) {
      setError("Failed to load delivery dashboard: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndOrders();
  }, [navigate]);

  // Load basic feedback summary for delivered orders
  useEffect(() => {
    const loadRatingSummary = async () => {
      const deliveredOrderIds = orders.filter(o => o.status === 'Delivered').map(o => o.id);
      if (!deliveredOrderIds.length) {
        setRatingSummary(null);
        return;
      }

      try {
        setRatingLoading(true);
        const baseUrl = process.env.REACT_APP_API_URL || '';
        const query = encodeURIComponent(deliveredOrderIds.join(','));
        const resp = await fetch(`${baseUrl}/api/feedback/delivery/summary?orderIds=${query}`);
        if (!resp.ok) {
          setRatingSummary(null);
          return;
        }
        const data = await resp.json();
        setRatingSummary(data);
      } catch (e) {
        setRatingSummary(null);
      } finally {
        setRatingLoading(false);
      }
    };

    loadRatingSummary();
  }, [orders]);

  // Register for web push notifications (delivery users)
  useEffect(() => {
    const setupMessaging = async () => {
      try {
        const current = getCurrentUser();
        if (!current) return;
        await requestAndSaveFcmToken(current.uid);
        // Foreground notification listener
        const unsubscribe = await onForegroundNotification((payload) => {
          const title = payload.notification?.title || 'Notification';
          const body = payload.notification?.body || '';
          setSuccess(`${title}: ${body}`);
          setTimeout(() => setSuccess(''), 4000);
        });
        return unsubscribe;
      } catch (e) {
        // Non-fatal: continue without notifications
        console.warn('FCM setup failed:', e?.message);
      }
    };
    const unsubPromise = setupMessaging();
    return () => {
      // detach listener if created
      try { unsubPromise.then((u)=>u && u()); } catch (_) {}
    };
  }, []);

  // Pick a default order for Update Status view when orders change
  useEffect(() => {
    if (orders && orders.length > 0) {
      const candidate = orders.find(o => o.status !== 'Delivered') || orders[0];
      setSelectedForUpdate(candidate);
      const otpCandidate = orders.find(o => o.status === 'Out for Delivery') || null;
      setSelectedForOtp(otpCandidate);
    } else {
      setSelectedForUpdate(null);
      setSelectedForOtp(null);
    }
  }, [orders]);

  // Handle status update
  const handleUpdateStatus = async (orderId, newStatus) => {
    // If status is "Delivered", we need OTP verification
    if (newStatus === "Delivered") {
      const order = orders.find(o => o.id === orderId);
      setSelectedOrder(order);
      setIsOtpModalOpen(true);
      return;
    }
    
    // For other status updates, proceed directly
    try {
      setUpdatingOrder(true);
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        setSuccess(`Order status updated to ${newStatus}`);
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to update order status");
      }
    } catch (err) {
      setError("Error updating order: " + err.message);
    } finally {
      setUpdatingOrder(false);
    }
  };
  
  // Handle OTP verification and delivery confirmation
  const handleDeliveryConfirmation = async () => {
    if (!selectedOrder || !otpCode) return;
    
    try {
      setUpdatingOrder(true);
      const result = await updateOrderStatus(selectedOrder.id, "Delivered", otpCode);
      
      if (result.success) {
        setSuccess("Order marked as delivered successfully");
        // Update local state
        setOrders(orders.map(order => 
          order.id === selectedOrder.id ? { ...order, status: "Delivered" } : order
        ));
        
        // Close modal and reset
        setIsOtpModalOpen(false);
        setSelectedOrder(null);
        setOtpCode("");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to verify OTP");
      }
    } catch (err) {
      setError("Error confirming delivery: " + err.message);
    } finally {
      setUpdatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate metrics
  const pendingDeliveries = orders.filter(order => order.status === 'Ready for Delivery').length;
  const completedDeliveries = orders.filter(order => order.status === 'Delivered').length;
  const todaysDeliveries = orders.filter(order => {
    const today = new Date().toISOString().split('T')[0];
    return order.date === today;
  }).length;

  const totalOrders = orders.length;
  const assignedCount = orders.filter(o => o.status === 'Approved').length;
  const pickedCount = orders.filter(o => o.status === 'Picked Up').length;
  const outForDeliveryCount = orders.filter(o => o.status === 'Out for Delivery').length;

  const handleDirectOtpVerify = async () => {
    if (!selectedForOtp || !otpCode) return;
    try {
      setUpdatingOrder(true);
      const result = await updateOrderStatus(selectedForOtp.id, 'Delivered', otpCode);
      if (result.success) {
        setSuccess('Order marked as delivered successfully');
        setOrders(orders.map(order =>
          order.id === selectedForOtp.id ? { ...order, status: 'Delivered' } : order
        ));
        setOtpCode('');
        // refresh OTP list
        const next = orders.find(o => o.id !== selectedForOtp.id && o.status === 'Out for Delivery') || null;
        setSelectedForOtp(next);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to verify OTP');
      }
    } catch (err) {
      setError('Error confirming delivery: ' + err.message);
    } finally {
      setUpdatingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold">MH</div>
            <div>
              <p className="font-semibold text-gray-900">Delivery Dashboard</p>
              <p className="text-xs text-gray-500">Welcome back, {userData?.name || user?.displayName || 'Delivery User'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchUserAndOrders}
              title="Refresh"
              className="px-3 py-2 rounded-md text-sm border hover:bg-gray-50"
            >
              Refresh
            </button>
            <div className="px-3 py-2 text-sm text-gray-700">{user?.email || ''}</div>
          </div>
        </div>
      </div>

      {/* Shell with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3 bg-white border rounded-lg h-max">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">🚚</div>
              <div>
                <p className="text-sm font-semibold">MediHaven</p>
                <p className="text-xs text-gray-500">Delivery Portal</p>
              </div>
            </div>
          </div>
          <nav className="p-2">
            <button onClick={() => setActiveTab('assigned')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab==='assigned' ? 'bg-gray-100' : 'text-gray-700 hover:bg-gray-50'}`}>Assigned Orders</button>
            <button onClick={() => setActiveTab('update')} className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeTab==='update' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>Update Status</button>
            <button onClick={() => setActiveTab('otp')} className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeTab==='otp' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>OTP Verification</button>
          </nav>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-9 space-y-6">
          {/* Alerts */}
          {error && (
            <div className={`${error.includes('index') ? 'bg-blue-50 border-blue-300' : 'bg-red-50 border-red-300'} border rounded-md p-4`}>
              <div className={`text-sm ${error.includes('index') ? 'text-blue-800' : 'text-red-800'}`}>
                {error.includes('index') ? (
                  <>
                    <p className="font-semibold">Database Setup Required</p>
                    <p className="mt-1">The delivery dashboard requires a Firestore index. Create it once and then refresh.</p>
                    <a
                      className="inline-flex mt-2 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs"
                      href="https://console.firebase.google.com/v1/r/project/medihaven-78f6d/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9tZWRpaGF2ZW4tNzhmNmQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL29yZGVycy9pbmRleGVzL18QARoUChBkZWxpdmVyeVBlcnNvbklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg"
                      rel="noopener noreferrer"
                      target="_blank"
                    >Create Firebase Index</a>
                  </>
                ) : (
                  <p>{error}</p>
                )}
              </div>
            </div>
          )}

          {/* OTP Verification */}
          {activeTab === 'otp' && (
          <section className="space-y-4">
            {/* Section Heading */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">OTP Verification</h1>
              <p className="text-sm text-gray-500">Verify delivery with customer's OTP</p>
            </div>

            <div className="bg-white border rounded-lg">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Order Details</span>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-500">Order</label>
                  <select
                    className="text-sm border rounded-md px-2 py-1"
                    value={selectedForOtp?.id || ''}
                    onChange={(e) => setSelectedForOtp(orders.find(o => o.id === e.target.value))}
                  >
                    <option value="" disabled>Select order</option>
                    {orders.filter(o => o.status === 'Out for Delivery').map(o => (
                      <option key={o.id} value={o.id}>{o.id} — {o.customer}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(!selectedForOtp) ? (
                <div className="p-6 text-sm text-gray-500">No orders are currently out for delivery.</div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Order Details */}
                  <div className="bg-white border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{selectedForOtp.id}</p>
                        <p className="text-xs text-gray-500">Out for Delivery</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full border bg-orange-50 text-orange-700 border-orange-200">Out for Delivery</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <p className="font-medium">Customer</p>
                        <p className="text-gray-600">{selectedForOtp.customer}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="font-medium">Delivery Address</p>
                        <p className="text-gray-600">{selectedForOtp.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Verify Delivery */}
                  <div className="bg-white border rounded-xl p-5">
                    <h3 className="font-semibold mb-3">Verify Delivery</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800 mb-4">
                      <p className="font-medium">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1 mt-1">
                        <li>Ask the customer for their delivery OTP.</li>
                        <li>Enter the 6-digit OTP below.</li>
                        <li>Confirm delivery after successful verification.</li>
                      </ol>
                    </div>
                    <label className="block text-sm font-medium text-gray-700">Enter Customer OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleDirectOtpVerify}
                        disabled={updatingOrder || !otpCode || !selectedForOtp}
                        className={`px-4 py-2 rounded-md text-white text-sm ${updatingOrder || !otpCode || !selectedForOtp ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                      >{updatingOrder ? 'Verifying...' : 'Confirm Delivery'}</button>
                      <button
                        onClick={() => setOtpCode('')}
                        className="px-4 py-2 rounded-md border text-sm"
                      >Clear</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold mt-1">{totalOrders}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-xs text-gray-500">Assigned</p>
              <p className="text-2xl font-semibold mt-1">{assignedCount}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-xs text-gray-500">Picked Up</p>
              <p className="text-2xl font-semibold mt-1">{pickedCount}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-xs text-gray-500">Out for Delivery</p>
              <p className="text-2xl font-semibold mt-1">{outForDeliveryCount}</p>
            </div>
          </div>

          {/* Rating Summary Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4 lg:col-span-1">
              <p className="text-xs text-gray-500 mb-1">Customer Rating</p>
              {ratingLoading ? (
                <p className="text-sm text-gray-500">Loading rating...</p>
              ) : ratingSummary && ratingSummary.count > 0 ? (
                <>
                  <p className="text-2xl font-semibold text-gray-900">
                    {ratingSummary.averageRating?.toFixed(1)} / 5
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Based on {ratingSummary.count} delivered orders</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <p className="font-medium text-green-700">Positive</p>
                      <p>{ratingSummary.positive}</p>
                    </div>
                    <div>
                      <p className="font-medium text-yellow-700">Neutral</p>
                      <p>{ratingSummary.neutral}</p>
                    </div>
                    <div>
                      <p className="font-medium text-red-700">Negative</p>
                      <p>{ratingSummary.negative}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No feedback received yet from delivered orders.</p>
              )}
            </div>
          </div>

          {/* Assigned Orders */}
          {activeTab === 'assigned' && (
          <section className="bg-white border rounded-lg">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold">Assigned Orders</h2>
              <p className="text-xs text-gray-500">View and manage your assigned deliveries</p>
            </div>

            {orders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500 text-sm">No orders available for delivery</p>
                <button
                  onClick={fetchUserAndOrders}
                  className="mt-3 inline-flex items-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white"
                >Refresh</button>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <p className="text-xs text-gray-500">Assigned {order.date}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border 
                        ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          order.status === 'Out for Delivery' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          order.status === 'Picked Up' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'}`}>{order.status}</span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">👤</span>
                        <span>{order.customer}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">📍</span>
                        <span>{order.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">🧾</span>
                        <span>{order.items} items · {order.total}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.status === 'Approved' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Picked Up')}
                          disabled={updatingOrder}
                          className="px-3 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                        >Mark as Picked Up</button>
                      )}
                      {order.status === 'Picked Up' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                          disabled={updatingOrder}
                          className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >Update Status</button>
                      )}
                      {(order.status === 'Picked Up' || order.status === 'Out for Delivery') && (
                        <button
                          onClick={() => setMapOrder(order)}
                          className="px-3 py-2 text-sm rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50"
                        >Live Map</button>
                      )}
                      {order.status === 'Out for Delivery' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                            disabled={updatingOrder}
                            className="px-3 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >Verify Delivery</button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Picked Up')}
                            disabled={updatingOrder}
                            className="px-3 py-2 text-sm rounded-md border"
                          >Update Status</button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedForUpdate(order);
                          setActiveTab('update');
                        }}
                        className="px-3 py-2 text-sm rounded-md border"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          )}

          {/* Update Status */}
          {activeTab === 'update' && (
          <section className="space-y-4">
            <div className="bg-white border rounded-lg">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Update Status</h2>
                  <p className="text-xs text-gray-500">Choose an order and update its delivery progress</p>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-500">Order</label>
                  <select
                    className="text-sm border rounded-md px-2 py-1"
                    value={selectedForUpdate?.id || ''}
                    onChange={(e) => setSelectedForUpdate(orders.find(o => o.id === e.target.value))}
                  >
                    <option value="" disabled>Select order</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.id} — {o.status}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(!selectedForUpdate) ? (
                <div className="p-6 text-sm text-gray-500">No orders to update.</div>
              ) : (
                <div className="p-5">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">Order {selectedForUpdate.id}</p>
                        <p className="text-xs text-gray-500">Assigned {selectedForUpdate.date}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border 
                        ${selectedForUpdate.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          selectedForUpdate.status === 'Out for Delivery' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          selectedForUpdate.status === 'Picked Up' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'}`}>{selectedForUpdate.status}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <p className="font-medium">Customer</p>
                        <p className="text-gray-600">{selectedForUpdate.customer}</p>
                      </div>
                      <div>
                        <p className="font-medium">Items</p>
                        <p className="text-gray-600">{selectedForUpdate.items} · {selectedForUpdate.total}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="font-medium">Delivery Address</p>
                        <p className="text-gray-600">{selectedForUpdate.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 bg-white border rounded-lg p-5">
                    <h3 className="font-semibold mb-4">Delivery Timeline</h3>
                    <div className="space-y-5">
                      {['Approved','Picked Up','Out for Delivery','Delivered'].map((step, idx) => {
                        const statusOrder = ['Approved','Picked Up','Out for Delivery','Delivered'];
                        const currentIndex = statusOrder.indexOf(selectedForUpdate.status);
                        const stepIndex = idx;
                        const reached = stepIndex <= currentIndex;
                        return (
                          <div key={step} className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${reached ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-400'}`}>{reached ? '✓' : idx+1}</div>
                              <div>
                                <p className="font-medium">{step}</p>
                                <p className="text-xs text-gray-500">{step==='Approved' && 'Order is ready for pickup'}{step==='Picked Up' && 'Order picked up from pharmacy'}{step==='Out for Delivery' && 'On the way to customer'}{step==='Delivered' && 'Successfully delivered to customer'}</p>
                              </div>
                            </div>
                            {step === selectedForUpdate.status && step !== 'Delivered' && (
                              <div>
                                {step === 'Approved' && (
                                  <button onClick={() => handleUpdateStatus(selectedForUpdate.id, 'Picked Up')} disabled={updatingOrder} className="px-3 py-2 text-xs rounded-md bg-gray-900 text-white">Mark as Picked Up</button>
                                )}
                                {step === 'Picked Up' && (
                                  <button onClick={() => handleUpdateStatus(selectedForUpdate.id, 'Out for Delivery')} disabled={updatingOrder} className="px-3 py-2 text-xs rounded-md bg-blue-600 text-white">Update to Out for Delivery</button>
                                )}
                                {step === 'Out for Delivery' && (
                                  <button onClick={() => handleUpdateStatus(selectedForUpdate.id, 'Delivered')} disabled={updatingOrder} className="px-3 py-2 text-xs rounded-md bg-green-600 text-white">Verify Delivery</button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
          )}
        </main>
      </div>
      
      {mapOrder && user && (
        <DeliveryMapPanel
          deliveryPersonId={user.uid}
          orderId={mapOrder.id}
          customerLocation={mapOrder.customerLocation || null}
          onClose={() => setMapOrder(null)}
        />
      )}

      {/* Success Message */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-green-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <p className="font-bold">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delivery Confirmation
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Please enter the OTP code provided by the customer to confirm delivery.
                      </p>
                      <div className="mt-4">
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                          OTP Code
                        </label>
                        <input
                          type="text"
                          name="otp"
                          id="otp"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Enter 6-digit OTP"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    updatingOrder || !otpCode ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={handleDeliveryConfirmation}
                  disabled={updatingOrder || !otpCode}
                >
                  {updatingOrder ? "Verifying..." : "Confirm Delivery"}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setIsOtpModalOpen(false);
                    setSelectedOrder(null);
                    setOtpCode("");
                  }}
                  disabled={updatingOrder}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryDashboard;