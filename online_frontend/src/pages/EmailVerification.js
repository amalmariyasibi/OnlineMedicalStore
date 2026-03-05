import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getCurrentUser, 
  sendEmailVerification, 
  isAuthenticated,
  logoutUser
} from "../firebase";

function EmailVerification() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    
    // Get current user data
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      
      // If user is already verified, redirect to home
      if (currentUser.emailVerified) {
        navigate("/");
      }
    } else {
      navigate("/login");
    }
    
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (countdown > 0) return;
    
    setError("");
    setSuccess("");
    setSending(true);
    
    try {
      const result = await sendEmailVerification();
      if (result.success) {
        setSuccess("Verification email sent! Please check your inbox.");
        setCountdown(60); // Set a 60-second countdown before allowing resend
      } else {
        setError(result.error || "Failed to send verification email");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setSending(false);
    }
  };

  const handleRefreshStatus = async () => {
    setLoading(true);
    
    try {
      // Force refresh the user to check if email has been verified
      const currentUser = getCurrentUser();
      await currentUser.reload();
      
      if (currentUser.emailVerified) {
        navigate("/");
      } else {
        setUser({ ...currentUser });
      }
    } catch (err) {
      setError(err.message || "Failed to refresh status");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="flex items-center justify-center min-h-screen bg-blue-500">
      <div className="bg-white p-8 rounded shadow-md w-96 max-w-full">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">Verify Your Email</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <div className="text-center mb-6">
          <p className="text-gray-700 mb-4">
            We've sent a verification email to:
          </p>
          <p className="font-medium text-gray-900 mb-4">
            {user?.email}
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Please check your email and click the verification link to activate your account.
            If you don't see the email, check your spam folder.
          </p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleResendVerification}
              className={`w-full py-2 px-4 rounded ${
                countdown > 0 || sending
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              disabled={countdown > 0 || sending}
            >
              {sending
                ? "Sending..."
                : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend Verification Email"}
            </button>
            
            <button
              onClick={handleRefreshStatus}
              className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
            >
              I've Verified My Email
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerification;