import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserNotifications, markNotificationRead } from "../utils/notifications";
import { Link } from "react-router-dom";

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  const load = async () => {
    try {
      if (!currentUser) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await getUserNotifications(currentUser.uid);
      if (res.success) {
        setNotifications(res.notifications);
        setError("");
      } else {
        setError(res.error || "Failed to load notifications");
      }
    } catch (e) {
      setError(e.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  const handleMarkRead = async (id) => {
    try {
      setMarking(true);
      const res = await markNotificationRead(id);
      if (res.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
      }
    } finally {
      setMarking(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarking(true);
      const unread = notifications.filter((n) => n.status !== "read");
      for (const n of unread) {
        await markNotificationRead(n.id);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">Order updates and important messages</p>
        </div>
        <div className="space-x-2">
          <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800">My Orders</Link>
          <button
            onClick={handleMarkAllRead}
            disabled={marking || notifications.length === 0}
            className={`ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              marking ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {marking ? "Marking..." : "Mark all read"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have any notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {notifications.map((n) => (
              <li key={n.id} className={`${n.status !== "read" ? "bg-blue-50" : ""}`}>
                <div className="px-4 py-5 sm:px-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{n.title || "Notification"}</h3>
                    <p className="mt-1 text-sm text-gray-600">{n.body}</p>
                    {n.data?.orderId && (
                      <p className="mt-1 text-xs text-gray-500">Order ID: {n.data.orderId}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ""}</p>
                  </div>
                  <div className="ml-4">
                    {n.status !== "read" && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        disabled={marking}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                          marking ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
    </div>
  );
};

export default Notifications;
