# MediHaven - Online Medical Store

## Overview

MediHaven is a comprehensive online medical store application with role-based access control (RBAC) and integrated payment processing. The system supports three user roles and includes Razorpay payment integration for seamless online transactions.

### User Roles

- **Admin**: Can manage users, products, orders, and view analytics
- **Customer**: Can browse products, place orders, make payments, and view order history  
- **Delivery Boy**: Can view assigned deliveries and update delivery status

### Key Features

- 🛒 **Product Management**: Browse medicines and healthcare products
- 💳 **Payment Integration**: Razorpay for secure online payments
- 📦 **Order Management**: Complete order lifecycle from placement to delivery
- 🔐 **Authentication**: Firebase Auth with Google/Facebook login
- 📱 **Responsive Design**: Mobile-friendly interface
- 🚚 **Delivery Tracking**: Real-time order status updates

## Implementation Details

### Backend (Express.js + MongoDB)

1. **User Model**
   - Includes a `role` field with possible values: `customer`, `admin`, `deliveryBoy`
   - Default role is `customer` for new registrations

2. **Authentication Middleware**
   - `protect`: Verifies JWT token and attaches user data to request
   - `authorize`: Restricts access based on user role

3. **Role-Specific Routes**
   - `/api/auth`: Authentication routes (register, login, get profile)
   - `/api/admin`: Admin-only routes for user management and dashboard
   - `/api/customer`: Customer-specific routes for profile and orders
   - `/api/delivery`: Delivery-specific routes for assignments and status updates

### Frontend (React + Firebase)

1. **Authentication**
   - Firebase Authentication for email/password, Google, and Facebook login
   - JWT token stored for backend API requests

2. **Role-Based UI**
   - Different dashboards and navigation based on user role
   - `ProtectedRoute` component to restrict access based on role

3. **User Management**
   - Admin dashboard for managing users and their roles
   - Profile management for all users

## Testing

A test script (`test-auth.js`) is provided to verify the authentication and role-based access control functionality. It tests:

1. User registration with different roles
2. User login and token generation
3. Access control for different routes based on user role

To run the tests:

```bash
cd online_backend
npm install axios
node test-auth.js
```

## Security Considerations

1. **Never expose secrets**: Keep Key Secret on backend only
2. **Payment verification**: Always verify payments server-side
3. **HTTPS in production**: Use SSL certificates
4. **Input validation**: Validate all user inputs
5. **Rate limiting**: Implement API rate limits

## Future Improvements

1. Add more granular permissions within roles
2. Implement token refresh mechanism  
3. Add two-factor authentication for admin users
4. Audit logging for sensitive operations
5. Email/SMS notifications with real services
6. Advanced analytics and reporting
7. Inventory management system
8. Prescription upload and verification

# ONLINE MEDICAL STORE

This is a full-stack e-commerce application for an online medical store.

## Project Structure

```
ONLINE MEDICAL STORE/
├── backend/                  # Primary backend (minimal routes)
├── online_backend/         # Full backend with MVC structure
└── online_frontend/        # React frontend application
```

## Quick Start

1. **Frontend**: See `online_frontend/README.md`
2. **Backend**: See `online_backend/README.md`

## Deployment

- **Frontend**: Can be deployed to Render as a static site. See `online_frontend/README_RENDER.md` for detailed instructions.
- **Backend**: Can be deployed to Vercel. See `online_backend/README.md` for detailed instructions.

A root-level [package.json](file:///d:/MINIPROJECT/ONLINE%20MEDICAL%20STORE%20(8)/ONLINE%20MEDICAL%20STORE/package.json) has been added to facilitate deployment by delegating commands to the appropriate subdirectories.

## Development Setup

1. Install dependencies in both frontend and backend directories
2. Set up environment variables
3. Start both servers separately
