// src/components/Layout.js
import React from "react";
import { Link } from "react-router-dom";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-gray-200 p-4 flex gap-6">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/login" className="hover:underline">Login</Link>
        <Link to="/register" className="hover:underline">Register</Link>
      </nav>

      {/* Page content */}
      <main className="p-6 flex justify-center items-center">
        {children}
      </main>
    </div>
  );
}

export default Layout;
