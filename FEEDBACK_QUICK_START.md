# Feedback & Rating System - Quick Start Guide

## 🚀 Getting Started

### Backend Setup

1. **Install Dependencies**
```bash
cd online_backend
npm install
```

The `natural` library for ML-based sentiment analysis has been added.

2. **Start Backend Server**
```bash
npm start
```

Server will run on `http://localhost:4321`

### Frontend Setup

1. **Start Frontend**
```bash
cd online_frontend
npm start
```

Frontend will run on `http://localhost:3000`

## 📱 Using the Feedback System

### For Customers

#### 1. Submit Feedback
1. Go to "My Orders" page (`/orders`)
2. Find a delivered order
3. Click "Rate Order" button
4. Fill in the feedback form:
   - Overall rating (required)
   - Product quality rating
   - Delivery service rating
   - Packaging rating
   - Delivery personnel rating
   - Comments (optional)
5. Click "Submit Feedback"

#### 2. View Your Feedbacks
1. Navigate to `/my-feedbacks`
2. See all your submitted feedbacks
3. View sentiment analysis results
4. Check admin responses
5. Edit existing feedback if needed

### For Admins

#### 1. View Analytics Dashboard
1. Login as admin
2. Navigate to `/admin/feedback-analytics`
3. View:
   - Total feedback count
   - Average ratings
   - Sentiment distribution
   - Trend analysis
   - Common topics

#### 2. Filter Feedbacks
- Filter by sentiment (positive/neutral/negative)
- Filter by rating range
- Filter by date range
- View paginated results

#### 3. Respond to Feedback
1. Find feedback in the list
2. Click "Respond" button
3. Enter your response
4. Feedback is marked as resolved

### For Delivery Personnel

#### View Your Rating
1. Access delivery dashboard
2. View your average rating
3. See recent customer feedback
4. Track performance over time

## 🔗 API Endpoints

### Customer Endpoints
```
POST   /api/feedback/:orderId          - Submit/update feedback
GET    /api/feedback/my/:orderId       - Get feedback for order
GET    /api/feedback/my                - Get all my feedbacks
```

### Admin Endpoints
```
GET    /api/feedback/admin/all         - Get all feedbacks
GET    /api/feedback/admin/analytics   - Get analytics
PUT    /api/feedback/admin/respond/:id - Respond to feedback
```

### Delivery Endpoints
```
GET    /api/feedback/delivery/summary              - Get summary
GET    /api/feedback/delivery/personnel/:id        - Get personnel rating
```

## 🧪 Testing

### Test Customer Feedback
```javascript
// Example: Submit feedback
const response = await fetch('http://localhost:4321/api/feedback/ORDER123', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ratingOverall: 5,
    ratingProduct: 5,
    ratingDelivery: 4,
    ratingPackaging: 5,
    deliveryRating: 4,
    comment: 'Great service! Fast delivery.',
    deliveryComment: 'Very professional'
  })
});
```

### Test Sentiment Analysis
Try these comments to test sentiment detection:

**Positive:**
- "Excellent service! Very happy with the quality."
- "Fast delivery and great products. Highly recommend!"
- "Amazing experience, will order again."

**Negative:**
- "Very disappointed. Late delivery and poor quality."
- "Terrible service. Products were damaged."
- "Bad experience. Will not order again."

**Neutral:**
- "Order received. Everything as expected."
- "Delivery was on time. Products are okay."

## 🎯 Key Features

### ML-Based Sentiment Analysis
- Automatic sentiment detection (positive/neutral/negative)
- Confidence scoring
- Keyword extraction
- Topic tagging

### Multi-Dimensional Ratings
- Overall experience
- Product quality
- Delivery service
- Packaging
- Delivery personnel

### Analytics Dashboard
- Real-time metrics
- Trend analysis
- Sentiment distribution
- Common topics
- Top performers

### Admin Response System
- Respond to customer feedback
- Mark as resolved
- Track response time

## 🔧 Configuration

### Environment Variables
Make sure these are set in your `.env` files:

**Backend (.env)**
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=4321
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:4321
```

## 📊 Database Schema

### Feedback Collection
```javascript
{
  orderId: String,
  customer: ObjectId,
  ratingOverall: Number (1-5),
  ratingProduct: Number (1-5),
  ratingDelivery: Number (1-5),
  ratingPackaging: Number (1-5),
  deliveryPersonnel: ObjectId,
  deliveryRating: Number (1-5),
  deliveryComment: String,
  comment: String,
  sentimentLabel: String,
  sentimentScore: Number,
  sentimentConfidence: Number,
  tags: [String],
  isResolved: Boolean,
  adminResponse: String,
  respondedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 UI Components

### FeedbackForm
- Star rating interface
- Multi-category ratings
- Text areas for comments
- Responsive design

### MyFeedbacks
- List of all feedbacks
- Sentiment indicators
- Admin responses
- Edit functionality

### FeedbackAnalytics
- Dashboard overview
- Charts and metrics
- Filtering options
- Admin tools

## 🚨 Troubleshooting

### Issue: Sentiment analysis not working
**Solution:** Check that Natural.js is installed:
```bash
cd online_backend
npm install natural
```

### Issue: Feedback not saving
**Solution:** 
- Verify authentication token
- Check orderId format
- Ensure ratings are between 1-5

### Issue: Analytics not loading
**Solution:**
- Check admin permissions
- Verify API endpoint
- Check browser console for errors

## 📝 Next Steps

1. **Test the system:**
   - Submit feedback as a customer
   - View analytics as admin
   - Respond to feedback

2. **Customize:**
   - Adjust sentiment thresholds
   - Add more rating categories
   - Customize UI colors

3. **Integrate:**
   - Add feedback links to order emails
   - Show ratings on product pages
   - Display delivery personnel ratings

## 🎉 Success!

Your feedback and rating system is now ready to use! Customers can rate orders, admins can view analytics, and the ML system will automatically analyze sentiment.

For detailed documentation, see `MODULE_10_FEEDBACK_SYSTEM.md`
