import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Unauthorized() {
  const { currentUser, debugUserRole } = useAuth();
  
  const handleDebugClick = () => {
    debugUserRole();
    alert(`Current user role: ${currentUser?.role || 'No role'}`);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-red-600 py-4">
          <h2 className="text-center text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-center text-red-100">Unauthorized Access</p>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-6">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V8m0 0V6m0 0h2m-2 0H9m6 6v-2m0 0V6m0 0h2m-2 0H9" />
            </svg>
            <h1 className="mt-4 text-2xl font-bold text-gray-800">Unauthorized Access</h1>
            <p className="mt-2 text-gray-600">
              You don't have permission to access this page. Please contact an administrator if you believe this is an error.
            </p>
          </div>
          
          <div className="mt-6 flex justify-center space-x-4">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Home
            </Link>
            <button
              onClick={handleDebugClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Debug Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;