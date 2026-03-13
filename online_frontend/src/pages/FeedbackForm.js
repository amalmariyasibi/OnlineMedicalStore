import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const FeedbackForm = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [formData, setFormData] = useState({
    ratingOverall: 5,
    ratingProduct: 5,
    ratingDelivery: 5,
    ratingPackaging: 5,
    deliveryRating: 5,
    comment: '',
    deliveryComment: ''
  });

  useEffect(() => {
    fetchExistingFeedback();
  }, [orderId, fetchExistingFeedback]);

  const fetchExistingFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/feedback/my/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExistingFeedback(response.data);
      setFormData({
        ratingOverall: response.data.ratingOverall || 5,
        ratingProduct: response.data.ratingProduct || 5,
        ratingDelivery: response.data.ratingDelivery || 5,
        ratingPackaging: response.data.ratingPackaging || 5,
        deliveryRating: response.data.deliveryRating || 5,
        comment: response.data.comment || '',
        deliveryComment: response.data.deliveryComment || ''
      });
    } catch (error) {
      // No existing feedback, that's okay
      console.log('No existing feedback found');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/feedback/${orderId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Thank you for your feedback!');
      navigate('/orders');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <svg
              className={`w-8 h-8 ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-gray-600">{value}/5</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {existingFeedback ? 'Update Your Feedback' : 'Rate Your Order'}
          </h1>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Overall Rating */}
              <StarRating
                label="Overall Experience"
                value={formData.ratingOverall}
                onChange={(val) => setFormData({ ...formData, ratingOverall: val })}
              />

              {/* Product Rating */}
              <StarRating
                label="Product Quality"
                value={formData.ratingProduct}
                onChange={(val) => setFormData({ ...formData, ratingProduct: val })}
              />

              {/* Delivery Rating */}
              <StarRating
                label="Delivery Service"
                value={formData.ratingDelivery}
                onChange={(val) => setFormData({ ...formData, ratingDelivery: val })}
              />

              {/* Packaging Rating */}
              <StarRating
                label="Packaging"
                value={formData.ratingPackaging}
                onChange={(val) => setFormData({ ...formData, ratingPackaging: val })}
              />

              {/* Delivery Personnel Rating */}
              <StarRating
                label="Delivery Personnel"
                value={formData.deliveryRating}
                onChange={(val) => setFormData({ ...formData, deliveryRating: val })}
              />

              {/* General Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback (Optional)
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about your experience..."
                />
              </div>

              {/* Delivery Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Feedback (Optional)
                </label>
                <textarea
                  value={formData.deliveryComment}
                  onChange={(e) => setFormData({ ...formData, deliveryComment: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How was your delivery experience?"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
