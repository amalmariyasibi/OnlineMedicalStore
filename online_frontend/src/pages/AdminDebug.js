import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserData, createUserData } from '../firebase';
import { setUserAsAdmin } from '../utils/adminUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AdminDebug = () => {
  const { currentUser } = useAuth();
  const [debugInfo, setDebugInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const checkUserRole = async () => {
    if (!currentUser) {
      setDebugInfo('No user logged in');
      return;
    }

    setLoading(true);
    try {
      const userData = await getUserData(currentUser.uid);
      setDebugInfo(`
        Firebase Auth User: ${currentUser.email}
        UID: ${currentUser.uid}
        Role from AuthContext: ${currentUser.role || 'No role'}
        Role from Firestore: ${userData.success ? userData.data.role : 'Failed to fetch'}
        Full Firestore Data: ${JSON.stringify(userData.success ? userData.data : userData.error, null, 2)}
      `);
    } catch (error) {
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setUserAsAdminRole = async () => {
    if (!currentUser) {
      setDebugInfo('No user logged in');
      return;
    }

    setLoading(true);
    try {
      const result = await setUserAsAdmin(currentUser.uid);
      setDebugInfo(`Set user as admin: ${result.success ? 'Success' : result.error}`);
      if (result.success) {
        // Refresh the page to update the auth context
        window.location.reload();
      }
    } catch (error) {
      setDebugInfo(`Error setting admin role: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const setUserAsDeliveryBoy = async () => {
    if (!currentUser) {
      setDebugInfo('No user logged in');
      return;
    }

    setLoading(true);
    try {
      // Update user role in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        role: 'delivery boy',
        updatedAt: new Date()
      });
      
      setDebugInfo(`Set user as delivery boy: Success`);
      // Refresh the page to update the auth context
      window.location.reload();
    } catch (error) {
      setDebugInfo(`Error setting delivery boy role: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      checkUserRole();
    }
  }, [currentUser]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Page</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current User Info</h2>
        {currentUser ? (
          <div>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>UID:</strong> {currentUser.uid}</p>
            <p><strong>Display Name:</strong> {currentUser.displayName || 'Not set'}</p>
            <p><strong>Role (from AuthContext):</strong> {currentUser.role || 'No role set'}</p>
          </div>
        ) : (
          <p className="text-gray-500">No user logged in</p>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="space-x-4">
          <button
            onClick={checkUserRole}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Checking...' : 'Check User Role'}
          </button>
          <button
            onClick={setUserAsAdminRole}
            disabled={loading || !currentUser}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2"
          >
            {loading ? 'Setting...' : 'Set as Admin'}
          </button>
          <button
            onClick={setUserAsDeliveryBoy}
            disabled={loading || !currentUser}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Setting...' : 'Set as Delivery Boy'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {debugInfo || 'Click "Check User Role" to see debug information'}
        </pre>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Navigation</h2>
        <div className="space-x-4">
          <a href="/admin" className="text-blue-500 hover:text-blue-700">Go to Admin Dashboard</a>
          <a href="/delivery" className="text-blue-500 hover:text-blue-700">Go to Delivery Dashboard</a>
          <a href="/user-dashboard" className="text-blue-500 hover:text-blue-700">Go to User Dashboard</a>
          <a href="/login" className="text-blue-500 hover:text-blue-700">Go to Login</a>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;
