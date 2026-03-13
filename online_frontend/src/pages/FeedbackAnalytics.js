import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FeedbackAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    days: 30,
    sentiment: '',
    minRating: '',
    maxRating: ''
  });

  useEffect(() => {
    fetchAnalytics();
    fetchFeedbacks();
  }, [filters, fetchAnalytics, fetchFeedbacks]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/feedback/admin/analytics?days=${filters.days}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.sentiment) params.append('sentiment', filters.sentiment);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.maxRating) params.append('maxRating', filters.maxRating);
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/feedback/admin/all?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbacks(response.data.feedbacks || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (feedbackId, response) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/feedback/admin/respond/${feedbackId}`,
        { response },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Response submitted successfully!');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error responding to feedback:', error);
      alert('Failed to submit response');
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  if (!analytics) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Feedback Analytics Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Feedbacks</h3>
            <p className="text-3xl font-bold text-gray-800">{analytics.trends.totalCount}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Rating</h3>
            <p className="text-3xl font-bold text-blue-600">{analytics.averageRatings.overall}/5</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Trend</h3>
            <p className="text-2xl font-bold text-gray-800">
              {getTrendIcon(analytics.trends.trend)} {analytics.trends.trend}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Period</h3>
            <p className="text-lg font-semibold text-gray-800">{analytics.period}</p>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Sentiment Distribution</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {analytics.trends.sentimentDistribution.positive}
              </p>
              <p className="text-sm text-gray-600">Positive</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">
                {analytics.trends.sentimentDistribution.neutral}
              </p>
              <p className="text-sm text-gray-600">Neutral</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {analytics.trends.sentimentDistribution.negative}
              </p>
              <p className="text-sm text-gray-600">Negative</p>
            </div>
          </div>
        </div>

        {/* Category Ratings */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Average Ratings by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.averageRatings).map(([category, rating]) => (
              <div key={category} className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{rating}/5</p>
                <p className="text-sm text-gray-600 capitalize">{category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Common Tags */}
        {analytics.trends.commonTags.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Common Topics</h2>
            <div className="flex flex-wrap gap-2">
              {analytics.trends.commonTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {tag.tag} ({tag.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Feedbacks</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.sentiment}
              onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
            
            <input
              type="number"
              placeholder="Min Rating"
              value={filters.minRating}
              onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
              className="px-4 py-2 border rounded-md"
              min="1"
              max="5"
            />
            
            <input
              type="number"
              placeholder="Max Rating"
              value={filters.maxRating}
              onChange={(e) => setFilters({ ...filters, maxRating: e.target.value })}
              className="px-4 py-2 border rounded-md"
              min="1"
              max="5"
            />
            
            <button
              onClick={() => setFilters({ days: 30, sentiment: '', minRating: '', maxRating: '' })}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Feedbacks List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Feedbacks</h2>
          {loading ? (
            <p className="text-center py-8">Loading...</p>
          ) : feedbacks.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No feedbacks found</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Order: {feedback.orderId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Customer: {feedback.customer?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">★</span>
                        <span className="font-bold">{feedback.ratingOverall}/5</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(feedback.sentimentLabel)}`}>
                        {feedback.sentimentLabel}
                      </span>
                    </div>
                  </div>
                  
                  {feedback.comment && (
                    <p className="text-gray-700 mb-2">{feedback.comment}</p>
                  )}
                  
                  {feedback.tags && feedback.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {feedback.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {!feedback.isResolved && (
                    <button
                      onClick={() => {
                        const response = prompt('Enter your response:');
                        if (response) handleRespond(feedback._id, response);
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Respond
                    </button>
                  )}
                  
                  {feedback.adminResponse && (
                    <div className="mt-2 p-3 bg-blue-50 rounded">
                      <p className="text-sm font-semibold text-blue-800">Admin Response:</p>
                      <p className="text-sm text-gray-700">{feedback.adminResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalytics;
