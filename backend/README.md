# MediHaven Backend API

Backend server for MediHaven Online Medical Store with Razorpay payment integration.

## Features

- 💳 Razorpay payment integration
- 📧 Order confirmation notifications
- 🔐 Payment verification
- 📱 Webhook support
- 🚀 Express.js REST API

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your Razorpay credentials:
```env
RAZORPAY_KEY_ID=rzp_test_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_key_secret
PORT=4321
FRONTEND_URL=http://localhost:3000
```

If you don't have a `.env` yet, create one in the `backend` folder with the values above.

### Quick Diagnostics

Before testing a payment, confirm the server is healthy and your Razorpay keys are loaded:

1) Start the server and check health

```bash
npm run dev
# then in another terminal
curl http://localhost:4321/health
```

2) Verify Razorpay env presence

```bash
curl http://localhost:4321/api/payment/config
# Expected JSON has hasKeyId=true and hasKeySecret=true
```

If either value is false, fix your `.env` and restart the server.

### 3. Get Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test/Live API Keys
4. Copy Key ID and Key Secret to your `.env` file

### 4. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:4321`

## API Endpoints

### Payment Routes

- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment signature
- `GET /api/payment/payment/:paymentId` - Get payment details
- `POST /api/payment/webhook` - Razorpay webhook handler

### Notification Routes

- `POST /api/notifications/order-confirmation` - Send order confirmation
- `POST /api/notifications/order-status` - Send status update

### Health Check

- `GET /health` - Server health status

## Frontend Integration

Update your React app's environment variables:

```env
# In online_frontend/.env
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_id
REACT_APP_API_URL=http://localhost:4321
```

If you see an alert like "Failed to create payment order" or "Failed to initiate online payment", check the response body in the browser console and confirm:

- The backend `/api/payment/config` shows both keys present
- Network tab for `/api/payment/create-order` returns success
- The frontend `.env` contains `REACT_APP_RAZORPAY_KEY_ID` matching your Razorpay "Key ID"

## Testing Payments

Use Razorpay test cards:
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002

## Production Deployment

1. Replace test keys with live keys
2. Set `NODE_ENV=production`
3. Configure proper CORS origins
4. Set up webhook endpoints
5. Implement proper logging and monitoring

## Security Notes

- Never expose your Key Secret in frontend code
- Always verify payments on the backend
- Use HTTPS in production
- Implement rate limiting
- Validate all input data

## Support

For Razorpay integration help:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Integration Guide](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
