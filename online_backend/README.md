# Online Medical Store Backend

This is the backend API for the Online Medical Store application, built with Node.js, Express, and MongoDB.

## Deployment to Vercel

This project is configured for deployment to Vercel. Follow these steps:

1. Create an account at [Vercel](https://vercel.com/)
2. Install Vercel CLI: `npm install -g vercel`
3. Deploy using Vercel CLI: `vercel --prod`
   OR
4. Connect your GitHub repository to Vercel for automatic deployments

## Environment Variables

Make sure to set the following environment variables in your Vercel project settings:

- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret key
- `EMAIL_SERVICE` - Email service provider
- `EMAIL_USER` - Email username
- `EMAIL_PASSWORD` - Email password
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay key secret
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase client email
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `FIREBASE_DATABASE_URL` - Firebase database URL

## Local Development

1. Install dependencies: `npm install`
2. Create a `.env` file with your environment variables
3. Start the server: `npm start` or `npm run dev`

The server will run on port 4321 by default.