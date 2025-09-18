import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getCurrentUser, 
  updateUserProfile, 
  updateUserEmail, 
  updateUserPassword,
  isAuthenticated,
  logoutUser,
  sendEmailVerification
} from "../firebase";
import { auth } from "../firebaseConfig";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  
  // Edit mode states
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  
  // Loading states
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    
    // Get current user data with a reload to ensure we have the latest verification status
    const fetchUserData = async () => {
      try {
        // Force a reload of the user to get the latest email verification status
        await auth.currentUser.reload();
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setDisplayName(currentUser.displayName || "");
          setEmail(currentUser.email || "");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error reloading user data:", error);
        // Fallback to current user without reload
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setDisplayName(currentUser.displayName || "");
          setEmail(currentUser.email || "");
        }
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUpdatingProfile(true);
    
    try {
      const result = await updateUserProfile({ displayName });
      if (result.success) {
        setSuccess("Profile updated successfully!");
        setUser({ ...user, displayName });
        setEditingName(false);
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle email update
  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!currentPassword) {
      setError("Current password is required to update email");
      return;
    }
    
    setUpdatingEmail(true);
    
    try {
      const result = await updateUserEmail(email, currentPassword);
      if (result.success) {
        setSuccess("Email updated successfully! Please verify your new email address.");
        setUser({ ...user, email });
        setEditingEmail(false);
        setCurrentPassword("");
      } else {
        setError(result.error || "Failed to update email");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setUpdatingEmail(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!currentPassword) {
      setError("Current password is required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }
    
    setUpdatingPassword(true);
    
    try {
      const result = await updateUserPassword(newPassword, currentPassword);
      if (result.success) {
        setSuccess("Password updated successfully!");
        setEditingPassword(false);
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
      } else {
        setError(result.error || "Failed to update password");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Handle email verification
  const handleSendVerification = async () => {
    setError("");
    setSuccess("");
    
    try {
      const result = await sendEmailVerification();
      if (result.success) {
        setSuccess("Verification email sent! Please check your inbox.");
      } else {
        setError(result.error || "Failed to send verification email");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };
  
  // Refresh user data to check verification status
  const refreshVerificationStatus = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      // Force a reload of the user to get the latest email verification status
      await auth.currentUser.reload();
      const refreshedUser = getCurrentUser();
      if (refreshedUser) {
        setUser(refreshedUser);
        if (refreshedUser.emailVerified) {
          setSuccess("Email verification confirmed!");
        } else {
          setError("Email is not verified yet. Please check your inbox or request a new verification email.");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to refresh verification status");
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 m-4 rounded">
            {success}
          </div>
        )}
        
        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-800">Account Information</h2>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              Manage your account information and email preferences
            </p>
          </div>
          
          {/* Display Name Section */}
          <div className="mb-6 border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Display Name</h3>
              {!editingName ? (
                <button 
                  onClick={() => setEditingName(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              ) : null}
            </div>
            
            {!editingName ? (
              <p className="text-gray-700">{user?.displayName || "Not set"}</p>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={updatingProfile}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
                      updatingProfile ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    disabled={updatingProfile}
                  >
                    {updatingProfile ? "Updating..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setDisplayName(user?.displayName || "");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    disabled={updatingProfile}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {/* Email Section */}
          <div className="mb-6 border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Email Address</h3>
              {!editingEmail ? (
                <button 
                  onClick={() => setEditingEmail(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              ) : null}
            </div>
            
            {!editingEmail ? (
              <div>
                <p className="text-gray-700">{user?.email}</p>
                <div className="flex items-center mt-2">
                  {user?.emailVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Verified
                      </span>
                      <button
                        type="button"
                        onClick={handleSendVerification}
                        className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        Send Verification Email
                      </button>
                      <button
                        type="button"
                        onClick={refreshVerificationStatus}
                        className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        Refresh Status
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={updatingEmail}
                  />
                </div>
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password (required to update email)
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={updatingEmail}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
                      updatingEmail ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    disabled={updatingEmail}
                  >
                    {updatingEmail ? "Updating..." : "Update Email"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmail(false);
                      setEmail(user?.email || "");
                      setCurrentPassword("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    disabled={updatingEmail}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {/* Password Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Password</h3>
              {!editingPassword ? (
                <button 
                  onClick={() => setEditingPassword(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Change Password
                </button>
              ) : null}
            </div>
            
            {!editingPassword ? (
              <p className="text-gray-700">••••••••</p>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="currentPasswordForPw" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPasswordForPw"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={updatingPassword}
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={updatingPassword}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={updatingPassword}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
                      updatingPassword ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPassword(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setCurrentPassword("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    disabled={updatingPassword}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;