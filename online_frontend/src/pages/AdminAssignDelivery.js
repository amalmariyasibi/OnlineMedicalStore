import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  isAuthenticated,
  getCurrentUser,
  getUserData,
  getOrderById,
  getAllUsers,
  assignDeliveryWithSchedule
} from "../firebase";

function AdminAssignDelivery() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // form state
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [expectedTime, setExpectedTime] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        if (!isAuthenticated()) {
          navigate("/login");
          return;
        }
        const user = getCurrentUser();
        setCurrentUser(user);
        const userDataRes = await getUserData(user.uid);
        if (!userDataRes.success || userDataRes.data.role !== "admin") {
          navigate("/unauthorized");
          return;
        }
        // fetch order
        const orderRes = await getOrderById(orderId);
        if (!orderRes.success) {
          setError(orderRes.error || "Failed to load order");
          setLoading(false);
          return;
        }
        setOrder(orderRes.order);
        // fetch users
        const usersRes = await getAllUsers();
        if (usersRes.success) {
          setUsers(usersRes.users || []);
        } else {
          setError(usersRes.error || "Failed to load users");
        }
      } catch (e) {
        setError(e.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [orderId, navigate]);

  const deliveryUsers = useMemo(() => {
    return (users || []).filter(
      (u) => u.role === "delivery" || u.role === "delivery boy" || u.role === "deliveryboy"
    );
  }, [users]);

  const selectedDeliveryUser = useMemo(
    () => deliveryUsers.find((u) => u.uid === selectedDeliveryPersonId),
    [deliveryUsers, selectedDeliveryPersonId]
  );

  const handleAssign = async () => {
    if (!order || !selectedDeliveryPersonId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      let expectedAt = null;
      if (expectedDate) {
        // create Date from date and optional time
        const time = expectedTime || "09:00"; // default 9 AM
        const dt = new Date(`${expectedDate}T${time}:00`);
        if (!isNaN(dt.getTime())) expectedAt = dt;
      }
      const res = await assignDeliveryWithSchedule(order.id, selectedDeliveryPersonId, expectedAt);
      if (res.success) {
        setSuccess(
          `✅ Order ${order.orderId ? order.orderId.substring(0,8) : order.id.substring(0,8)} successfully assigned to ${selectedDeliveryUser?.displayName || selectedDeliveryUser?.email}.`
        );
        // brief delay to show success then go back to admin orders
        setTimeout(() => {
          navigate("/admin?tab=orders");
        }, 1200);
      } else {
        setError(res.error || "Failed to assign delivery");
      }
    } catch (e) {
      setError(e.message || "An error occurred while assigning delivery");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-4">
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">&larr; Back</button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">&larr; Back</button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Assign Delivery</h3>
          <p className="mt-1 text-sm text-gray-500">Assign this order to a delivery person</p>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Order Info */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Order Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded p-3">
                <p><span className="text-gray-600">Order ID:</span> <span className="font-medium">{order.orderId ? order.orderId : order.id}</span></p>
                <p><span className="text-gray-600">Customer Name:</span> <span className="font-medium">{order.customerName || order?.shippingAddress?.name || "Guest User"}</span></p>
                <p><span className="text-gray-600">Order Date:</span> <span className="font-medium">{order.createdAt ? (order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : new Date(order.createdAt).toLocaleString()) : "N/A"}</span></p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p><span className="text-gray-600">Order Total:</span> <span className="font-medium">₹{order.total?.toFixed(2) || "0.00"}</span></p>
                <p><span className="text-gray-600">Delivery Status:</span> <span className="font-medium">{order.status || "Pending"}</span></p>
                {order.deliveryPersonName && (
                  <p><span className="text-gray-600">Assigned To:</span> <span className="font-medium">{order.deliveryPersonName}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Boy Selection */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Delivery Boy Selection</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Delivery Boy</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedDeliveryPersonId}
                  onChange={(e) => setSelectedDeliveryPersonId(e.target.value)}
                >
                  <option value="">-- Choose --</option>
                  {deliveryUsers.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName || u.email} {u.status ? `(${u.status === 'Busy' ? 'Currently Delivering' : 'Available'})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p className="text-gray-600">Details</p>
                {selectedDeliveryUser ? (
                  <div className="mt-2 space-y-1">
                    <p><span className="text-gray-600">Name:</span> <span className="font-medium">{selectedDeliveryUser.displayName || selectedDeliveryUser.email}</span></p>
                    <p><span className="text-gray-600">Contact:</span> <span className="font-medium">{selectedDeliveryUser.contactNumber || selectedDeliveryUser.phone || 'N/A'}</span></p>
                    <p><span className="text-gray-600">Status:</span> <span className="font-medium">{selectedDeliveryUser.status || 'Available'}</span></p>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">Select a delivery boy to view details</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Date & Time */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Expected Delivery (optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={expectedTime}
                  onChange={(e) => setExpectedTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            {success && (
              <div role="alert" className="text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mr-auto">
                {success}
              </div>
            )}
            {error && (
              <div role="alert" className="text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mr-auto">
                {error}
              </div>
            )}
            <button
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => navigate("/admin?tab=orders")}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 rounded text-white ${submitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              onClick={handleAssign}
              disabled={submitting || !selectedDeliveryPersonId}
            >
              {submitting ? 'Assigning...' : 'Assign Delivery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAssignDelivery;
