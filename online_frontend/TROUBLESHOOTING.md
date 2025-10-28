# Troubleshooting Common Issues

## Payment API 404 Error

### Problem
```
Payment API response not OK: 404
Payment config check failed: Error: Payment API not reachable (status 404)
```

### Causes and Solutions

1. **Backend Not Deployed**
   - Ensure your backend is deployed and running
   - Check that the backend URL is accessible in a browser

2. **Incorrect REACT_APP_API_URL**
   - Verify the REACT_APP_API_URL environment variable is set correctly in Render
   - It should point to your deployed backend (e.g., https://your-backend.onrender.com)
   - Not to the frontend URL

3. **Backend Route Issues**
   - Check that your backend has the payment routes configured
   - The payment routes should be at `/api/payment/*`

4. **CORS Configuration**
   - Ensure your backend allows requests from your frontend domain
   - Check the CORS configuration in your backend server.js

### Debugging Steps

1. Test your backend URL directly in a browser:
   - Visit `https://your-backend-url.onrender.com/` - should show "API is running"
   - Visit `https://your-backend-url.onrender.com/api/payment/test` - should show test response

2. Check browser network tab:
   - Open Developer Tools (F12)
   - Go to Network tab
   - Try to make a payment
   - Look for failed requests to `/api/payment/*`

## Firebase 400 Error

### Problem
```
GET https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel 400 (Bad Request)
```

### Causes and Solutions

1. **Incorrect Firebase Configuration**
   - Verify all Firebase environment variables are set correctly
   - Check that your Firebase project exists and is properly configured

2. **Firebase Authentication Issues**
   - Ensure users are properly authenticated before accessing Firestore
   - Check that Firebase rules allow read/write access

3. **Network Issues**
   - Some networks block Firebase connections
   - Try accessing from a different network

### Debugging Steps

1. Verify Firebase Config:
   ```
   REACT_APP_FIREBASE_API_KEY
   REACT_APP_FIREBASE_AUTH_DOMAIN
   REACT_APP_FIREBASE_PROJECT_ID
   REACT_APP_FIREBASE_STORAGE_BUCKET
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID
   REACT_APP_FIREBASE_APP_ID
   ```

2. Test Firebase Connection:
   - Add logging to your Firebase initialization code
   - Check browser console for Firebase errors

## General Deployment Issues

### Environment Variables Not Set
- All environment variables must be set in the Render dashboard
- They are not automatically loaded from .env files

### Mixed Content Issues (HTTPS)
- If your backend is HTTP and frontend is HTTPS, you may get security errors
- Ensure both are served over HTTPS or configure your services accordingly

### API Calls to Wrong Domain
- Ensure REACT_APP_API_URL points to your backend, not frontend
- Frontend and backend must be on separate domains/services