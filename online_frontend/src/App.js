import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import Login from "./pages/Login.new";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Profile from "./pages/Profile.simple";
import ForgotPassword from "./pages/ForgotPassword";
import EmailVerification from "./pages/EmailVerification";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAssignDelivery from "./pages/AdminAssignDelivery";
import AdminCartMonitor from "./pages/AdminCartMonitor";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import Products from "./pages/ProductsCombined"; // WORKING VERSION - Fixed loading issues
import ProductsSimple from "./pages/ProductsSimple";
import ProductDetail from "./pages/ProductDetail";
import AdminProducts from "./pages/AdminProducts";
import ProductForm from "./pages/ProductForm";
import Medicines from "./pages/Medicines";
import MedicineDetail from "./pages/MedicineDetail";
import AdminMedicines from "./pages/AdminMedicines";
import MedicineForm from "./pages/MedicineForm";
import Cart from "./pages/CartEnhanced";
import Checkout from "./pages/CheckoutEnhanced";
import OrderConfirmation from "./pages/OrderConfirmation";
import Prescriptions from "./pages/Prescriptions";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import UserDashboard from "./pages/user/Dashboard";
import Notifications from "./pages/Notifications";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContextSimple";
import CartIcon from "./components/CartIcon";
import { logoutUser } from "./firebase";

// Navigation component with location awareness
const Navigation = ({ user, onLogout }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">MediHaven</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className={`${
                location.pathname === "/"
                  ? "border-blue-500 text-blue-700"
                  : "border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700"
              } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Home
              </Link>
              <Link 
                to="/medicines" 
                className={`${
                  location.pathname.startsWith("/medicines")
                    ? "border-blue-500 text-blue-700"
                    : "border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Medicines
              </Link>
              <Link 
                to="/products" 
                className={`${
                  location.pathname.startsWith("/products")
                    ? "border-blue-500 text-blue-700"
                    : "border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Products
              </Link>
              <Link to="/about" className={`${
                location.pathname === "/about"
                  ? "border-blue-500 text-blue-700"
                  : "border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700"
              } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                About Us
              </Link>
              <Link to="/contact" className={`${
                location.pathname === "/contact"
                  ? "border-blue-500 text-blue-700"
                  : "border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700"
              } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Contact
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user && (
              <div className="mr-4">
                <CartIcon />
              </div>
            )}
            {user && user.role === "admin" && (
              <Link to="/admin" className="text-gray-500 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium mr-2">
                Admin Dashboard
              </Link>
            )}
            {user && user.role === "delivery" && (
              <Link to="/delivery" className="text-gray-500 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium mr-2">
                Delivery Dashboard
              </Link>
            )}
            {user ? (
              <div className="flex items-center">
                <span className="text-gray-700 mr-4">
                  {user.email}
                </span>
                <button
                  onClick={onLogout}
                  className="text-gray-500 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-500 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Sign in
                </Link>
                <Link to="/register" className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Sign up
                </Link>
              </>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link to="/" className={`${
            location.pathname === "/"
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
          } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
            Home
          </Link>
          <Link to="/medicines" className={`${
            location.pathname.startsWith("/medicines")
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
          } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
            Medicines
          </Link>
          <Link to="/products" className={`${
            location.pathname.startsWith("/products")
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
          } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
            Products
          </Link>
          <Link to="/about" className={`${
            location.pathname === "/about"
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
          } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
            About Us
          </Link>
          <Link to="/contact" className={`${
            location.pathname === "/contact"
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
          } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
            Contact
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {user ? (
            <div>
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <svg className="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.displayName || "User"}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link to="/profile" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                  Your Profile
                </Link>
                <Link to="/cart" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                  Your Cart
                </Link>
                <Link to="/orders" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                  My Orders
                </Link>
                <Link to="/prescriptions" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                  My Prescriptions
                </Link>
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {user.role === "delivery" && (
                  <Link
                    to="/delivery"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Delivery Dashboard
                  </Link>
                )}
                <button
                  onClick={onLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-1">
              <Link to="/login" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                Sign in
              </Link>
              <Link to="/register" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Auth wrapper component
const AuthWrapper = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navigation user={currentUser} onLogout={handleLogout} />

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-500">
            &copy; 2023 MediHaven. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AuthWrapper>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Cart and Checkout routes - protected for logged in users only */}
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/order-confirmation/:orderId" element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            } />
            <Route path="/order-history" element={
              <ProtectedRoute>
                <div className="p-8 text-center text-xl">Order History (Coming Soon)</div>
              </ProtectedRoute>
            } />
            <Route path="/prescriptions" element={
              <ProtectedRoute>
                <Prescriptions />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/orders/:orderId" element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            } />
            {/* <Route path="/payment-test" element={
              <ProtectedRoute>
                <PaymentTest />
              </ProtectedRoute>
            } /> */}
            <Route path="/user-dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <div className="p-8 text-center text-xl">User Management (Coming Soon)</div>
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <div className="p-8 text-center text-xl">Order Management (Coming Soon)</div>
              </ProtectedRoute>
            } />
            <Route path="/admin/orders/assign/:orderId" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAssignDelivery />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <div className="p-8 text-center text-xl">Reports (Coming Soon)</div>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <div className="p-8 text-center text-xl">Settings (Coming Soon)</div>
              </ProtectedRoute>
            } />
            
            {/* Delivery routes */}
            <Route path="/delivery" element={
              <ProtectedRoute allowedRoles={["delivery"]}>
                <DeliveryDashboard />
              </ProtectedRoute>
            } />
            
            {/* Product routes */}
            <Route path="/products" element={<Products />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            
            {/* Admin product management routes */}
            <Route path="/admin/products" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/products/new" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/products/edit/:productId" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ProductForm />
              </ProtectedRoute>
            } />
            
            {/* Medicine routes */}
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/medicines/:medicineId" element={<MedicineDetail />} />
            
            {/* Admin medicine management routes */}
            <Route path="/admin/medicines" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMedicines />
              </ProtectedRoute>
            } />
            <Route path="/admin/medicines/new" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MedicineForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/medicines/edit/:medicineId" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MedicineForm />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
               <ProtectedRoute allowedRoles={["admin"]}>
                 <AdminDashboard />
               </ProtectedRoute>
             } />
             <Route path="/admin/cart-monitor" element={
               <ProtectedRoute allowedRoles={["admin"]}>
                 <AdminCartMonitor />
               </ProtectedRoute>
             } />
             <Route path="/admin/prescriptions" element={
               <ProtectedRoute allowedRoles={["admin"]}>
                 <div className="p-8 text-center text-xl">Prescription Verification (Coming Soon)</div>
               </ProtectedRoute>
             } />
            
            <Route path="/about" element={<div className="p-8 text-center text-xl">About Us Page (Coming Soon)</div>} />
            <Route path="/contact" element={<div className="p-8 text-center text-xl">Contact Page (Coming Soon)</div>} />
            </Routes>
          </AuthWrapper>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;