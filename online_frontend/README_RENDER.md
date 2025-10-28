# Deploying Frontend to Render

This guide explains how to deploy the Online Medical Store frontend to Render.

## Prerequisites

1. A Render account (https://render.com)
2. A GitHub/GitLab account connected to Render
3. The backend API deployed and accessible (needed for REACT_APP_API_URL)

## Critical Deployment Requirement

**THE MOST IMPORTANT STEP:** You MUST manually set the Root Directory to `online_frontend` in the Render dashboard because the frontend files are in a subdirectory of the repository.

If you don't do this, you will continue to get the error:
```
Could not read package.json: Error: ENOENT: no such file or directory, open '/opt/render/project/src/package.json'
```

## Deployment Steps

1. Push your code to a GitHub/GitLab repository
2. Go to Render Dashboard (https://dashboard.render.com)
3. Click "New +" and select "Static Site"
4. Connect your repository
5. **CRITICAL STEP:** Set the Root Directory to `online_frontend`
6. Configure the following settings:
   - Name: online-medical-store-frontend
   - Branch: main (or your default branch)
   - Build Command: `npm run build`
   - Publish Directory: `build`

## Environment Variables

Set the following environment variables in Render:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| REACT_APP_API_URL | URL of your deployed backend API | https://your-backend.onrender.com |
| REACT_APP_FIREBASE_API_KEY | Firebase API key | AIzaSyAjj6Dnah51Dkvg9rYcdSEZbJlJVyw1DMM |
| REACT_APP_FIREBASE_AUTH_DOMAIN | Firebase auth domain | medihaven-78f6d.firebaseapp.com |
| REACT_APP_FIREBASE_PROJECT_ID | Firebase project ID | medihaven-78f6d |
| REACT_APP_FIREBASE_STORAGE_BUCKET | Firebase storage bucket | medihaven-78f6d.appspot.com |
| REACT_APP_FIREBASE_MESSAGING_SENDER_ID | Firebase messaging sender ID | 935058134424 |
| REACT_APP_FIREBASE_APP_ID | Firebase app ID | 1:935058134424:web:5a4af882d150f3ddea07ed |
| REACT_APP_RAZORPAY_KEY_ID | Razorpay key ID | rzp_test_RH9Kx0Ibt9neI6 |

## Important Notes

1. Make sure to update `REACT_APP_API_URL` with your actual backend URL after deploying the backend
2. The frontend will automatically redirect API calls to the backend URL specified in REACT_APP_API_URL
3. Firebase configuration should match your Firebase project settings
4. For production, consider using environment-specific Razorpay keys
5. **THE ROOT DIRECTORY MUST BE SET TO `online_frontend` IN THE RENDER DASHBOARD**
6. The render.yaml file in this repository may not be automatically detected by Render, so you must set these settings manually
7. Even if you use the render.yaml file, you still need to manually verify the root directory setting

## Custom Domain (Optional)

1. In Render dashboard, go to your static site
2. Click "Settings" tab
3. Scroll to "Custom Domains"
4. Follow the instructions to add your domain

## Troubleshooting

- If the site doesn't load properly, check that all environment variables are set correctly
- Make sure the REACT_APP_API_URL points to your deployed backend
- Check browser console for any errors
- Verify that the build completes successfully in Render logs
- **ENSURE THE ROOT DIRECTORY IS SET TO `online_frontend` IN YOUR RENDER SETTINGS**
- If you continue to have issues, try creating a new static site in Render and manually entering all the settings above
- The error "Could not read package.json" means the root directory is not set correctly