---
description: Repository Information Overview
alwaysApply: true
---

# Online Medical Store Information

## Summary
A full-stack web application for an online medical store with user authentication, product/medicine management, cart functionality, and order processing. The project uses React for the frontend and Firebase for backend services.

## Structure
- **online_frontend/**: React-based frontend application with Firebase integration

## Language & Runtime
**Language**: JavaScript (React)
**Build System**: Create React App
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- react
- react-dom
- react-router-dom
- firebase/app
- firebase/auth
- firebase/firestore
- tailwindcss

## Build & Installation
```bash
cd online_frontend
npm install
npm start  # Development server
```

## Main Files & Resources
**Entry Point**: src/index.js
**Main Components**:
- App.js: Main application component with routing
- firebase.js: Firebase configuration and API functions
- contexts/: Context providers (AuthContext, CartContext)
- pages/: Application pages (Home, Products, Medicines, Cart)
- components/: Reusable UI components

## Features
- User authentication (login, register, password reset)
- Product and medicine browsing
- Search functionality
- Shopping cart
- Order processing
- Admin dashboard for product/medicine management
- Responsive design with Tailwind CSS

## Firebase Integration
**Services**:
- Authentication: Email/password login
- Firestore: Database for products, medicines, users, orders
- Collections: users, products, medicines, orders

## Application Structure
**Authentication**:
- Login/Register pages
- Protected routes for authenticated users
- Role-based access control (admin, customer)

**Product Management**:
- Browse products and medicines
- Search functionality
- Filter by category, price, availability
- Admin product management

**Shopping**:
- Add to cart functionality
- Cart management
- Checkout process
- Order confirmation

**Admin Features**:
- Dashboard with analytics
- Product/medicine management
- Order management
- User management