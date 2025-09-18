import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "../firebase";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const result = await sendPasswordResetEmail(email);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to send password reset email");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-500">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">Reset Password</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Password reset email sent! Check your inbox for further instructions.
            </div>
            <p className="mt-4 text-gray-600">
              Didn't receive the email? Check your spam folder or{" "}
              <button 
                onClick={handleSubmit} 
                className="text-blue-600 hover:underline"
                disabled={isLoading}
              >
                try again
              </button>
            </p>
            <Link to="/login" className="block mt-4 text-blue-600 hover:underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full p-2 mb-4 border rounded"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="text-center mt-4">
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;