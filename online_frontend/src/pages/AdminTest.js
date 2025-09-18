import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createAdminUser, testAdminLogin } from '../utils/createAdminUser';
import { logoutUser } from '../firebase';

const AdminTest = () => {
  const { currentUser } = useAuth();
  const [testEmail, setTestEmail] = useState('admin@test.com');
  const [testPassword, setTestPassword] = useState('admin123');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const result = await createAdminUser(testEmail, testPassword, 'Test Admin');
      setResult(result.success ? 'Admin user created successfully!' : `Error: ${result.error}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const result = await testAdminLogin(testEmail, testPassword);
      setResult(result.success ? `Login successful! Role: ${result.user.role}` : `Error: ${result.error}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setResult('Logged out successfully');
    } catch (error) {
      setResult(`Logout error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Admin Test Page</h1>
      
      {/* Current User Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current User Status</h2>
        {currentUser ? (
          <div>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>UID:</strong> {currentUser.uid}</p>
            <p><strong>Role:</strong> {currentUser.role || 'No role set'}</p>
            <p><strong>Display Name:</strong> {currentUser.displayName || 'Not set'}</p>
            <div className="mt-4">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No user logged in</p>
        )}
      </div>

      {/* Admin Creation Test */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create Admin User</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="admin@test.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="admin123"
            />
          </div>
          <button
            onClick={handleCreateAdmin}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Creating...' : 'Create Admin User'}
          </button>
        </div>
      </div>

      {/* Login Test */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Admin Login</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="admin@test.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="admin123"
            />
          </div>
          <button
            onClick={handleTestLogin}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Result</h2>
          <div className={`p-4 rounded ${
            result.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {result}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Navigation</h2>
        <div className="space-x-4">
          <a href="/admin" className="text-blue-500 hover:text-blue-700">Go to Admin Dashboard</a>
          <a href="/login" className="text-blue-500 hover:text-blue-700">Go to Login</a>
          <a href="/" className="text-blue-500 hover:text-blue-700">Go to Home</a>
        </div>
      </div>
    </div>
  );
};

export default AdminTest;
