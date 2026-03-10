import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyFeedbacks();
  }, []);

  const fetchMyFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/feedback/my`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Feedbacks</h1>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>

        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">You haven't submitted any feedback yet.</p>
            <button
              onClick={() => navigate('/orders')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Orders
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {feedbacks.map((feedback) => (
              <div key={feedback._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Order #{feedback.orderId}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-500 text-xl">★</span>
                      <span className="text-2xl font-bold text-gray-800">
                        {feedback.ratingOverall}/5
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(feedback.sentimentLabel)}`}>
                      {getSentimentEmoji(feedback.sentimentLabel)} {feedback.sentimentLabel}
                    </span>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Product</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {feedback.ratingProduct}/5
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Delivery</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {feedback.ratingDelivery}/5
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Packaging</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {feedback.ratingPackaging}/5
                    </p>
                  </div>
                  {feedback.deliveryRating && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Personnel</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {feedback.deliveryRating}/5
                      </p>
                    </div>
                  )}
                </div>

                {/* Comments */}
                {feedback.comment && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Your Feedback:</p>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{feedback.comment}</p>
                  </div>
                )}

                {feedback.deliveryComment && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Delivery Feedback:</p>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{feedback.deliveryComment}</p>
                  </div>
                )}

                {/* Tags */}
                {feedback.tags && feedback.tags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Response */}
                {feedback.adminResponse && (
                  <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      Response from Support Team:
                    </p>
                    <p className="text-gray-700">{feedback.adminResponse}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(feedback.respondedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Edit Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => navigate(`/feedback/${feedback.orderId}`)}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Edit Feedback
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFeedbacks;
