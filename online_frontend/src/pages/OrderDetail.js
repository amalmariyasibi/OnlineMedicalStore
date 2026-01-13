import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import OrderTrackingMap from '../components/OrderTrackingMap';

const OrderDetail = () => {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingOverall, setRatingOverall] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
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

    const fetchOrderDetail = async () => {
      try {
        if (!currentUser || !orderId) {
          setLoading(false);
          return;
        }

        const orderDoc = await getDoc(doc(db, 'orders', orderId));

        if (!orderDoc.exists()) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        const orderData = orderDoc.data();

        // Check if the order belongs to the current user
        if (orderData.userId !== currentUser.uid) {
          setError('You do not have permission to view this order');
          setLoading(false);
          return;
        }

        const formattedOrder = {
          id: orderDoc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate()?.toLocaleString() || 'Unknown date',
          updatedAt: orderData.updatedAt?.toDate()?.toLocaleString() || null
        };

        setOrder(formattedOrder);
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [currentUser, orderId, navigate]);

  // Fetch existing feedback for delivered orders (if any)
  useEffect(() => {
    const loadFeedback = async () => {
      if (!order || !order.status || order.status.toLowerCase() !== 'delivered') return;

      try {
        setFeedbackLoading(true);
        const baseUrl = process.env.REACT_APP_API_URL || '';
        const resp = await fetch(`${baseUrl}/api/feedback/my/${order.id}`);
        if (!resp.ok) {
          setFeedbackLoading(false);
          return;
        }
        const data = await resp.json();
        if (data && data.ratingOverall) {
          setRatingOverall(data.ratingOverall);
          setComment(data.comment || '');
        }
      } catch (e) {
        // Silent fail - feedback is optional
      } finally {
        setFeedbackLoading(false);
      }
    };

    loadFeedback();
  }, [order]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!order || ratingOverall < 1 || ratingOverall > 5) return;

    try {
      setFeedbackLoading(true);
      setFeedbackMessage('');
      const baseUrl = process.env.REACT_APP_API_URL || '';
      const resp = await fetch(`${baseUrl}/api/feedback/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ratingOverall, comment }),
      });

      if (!resp.ok) {
        setFeedbackMessage('Failed to submit feedback. Please try again.');
        return;
      }

      setFeedbackMessage('Thank you for your feedback!');
    } catch (e) {
      setFeedbackMessage('Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackLoading(false);
    }
  };

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
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-red-800">{error}</h3>
          <div className="mt-6">
            <Link
              to="/orders"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center">
          <p className="text-gray-500">Order not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to="/orders" className="text-gray-400 hover:text-gray-500">
                My Orders
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="m5.555 17.776 8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
            <li>
              <span className="text-gray-500">Order #{order.id.substring(0, 8)}</span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Order #{order.id}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Placed on {order.createdAt}
              </p>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-2">
                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                ₹{order.totalAmount?.toFixed(2) || '0.00'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.paymentMethod || 'Cash on Delivery'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Delivery Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.deliveryAddress ? (
                  <div>
                    <p>{order.deliveryAddress.street}</p>
                    <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}</p>
                    <p>{order.deliveryAddress.country}</p>
                  </div>
                ) : (
                  'Address not provided'
                )}
              </dd>
            </div>
            {order.updatedAt && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {order.updatedAt}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Feedback & Rating for Delivered Orders */}
      {order.status?.toLowerCase() === 'delivered' && (
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Rate Your Order</h4>
          <p className="text-xs text-gray-500 mb-3">
            Your feedback helps us improve our service and delivery quality.
          </p>
          <div className="bg-white shadow rounded-lg p-4">
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Rating</label>
                <select
                  className="mt-1 block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={ratingOverall}
                  onChange={(e) => setRatingOverall(Number(e.target.value))}
                >
                  <option value={0}>Select rating</option>
                  <option value={1}>1 - Very Poor</option>
                  <option value={2}>2 - Poor</option>
                  <option value={3}>3 - Average</option>
                  <option value={4}>4 - Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (optional)</label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Share your experience with delivery time, packaging, and overall service"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={feedbackLoading || ratingOverall < 1}
                  className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    feedbackLoading || ratingOverall < 1
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {feedbackLoading ? 'Submitting...' : 'Submit Rating'}
                </button>

                {feedbackMessage && (
                  <p className="text-sm text-green-600">{feedbackMessage}</p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Tracking (Customer View) */}
      {order.deliveryPersonId && order.status && !['delivered','cancelled'].includes(order.status.toLowerCase()) && (
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Track Delivery</h4>
          <p className="text-xs text-gray-500 mb-3">
            Your order is in delivery. You can see the approximate live location of the delivery partner below.
          </p>
          <div className="bg-white shadow rounded-lg p-4">
            <OrderTrackingMap
              deliveryPersonId={order.deliveryPersonId}
              orderId={order.id}
            />
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="mt-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Order Items</h4>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {order.items && order.items.map((item, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-16 w-16">
                    {item.imageUrl ? (
                      <img className="h-16 w-16 rounded-md object-cover" src={item.imageUrl} alt={item.name} />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">{item.name}</h5>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        {item.prescriptionRequired && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Prescription Required
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <Link
          to="/orders"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>

        {order.status?.toLowerCase() === 'delivered' && (
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Buy Again
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;