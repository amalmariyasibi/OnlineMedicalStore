import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmail, signInWithGoogle, signInWithFacebook, getUserData } from "../firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const validateForm = () => {
    // Email validation
    if (!email) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    // Password validation
    if (!password) {
      setError("Password is required");
      return false;
    } else if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithEmail(email, password);
      if (result.success) {
        // Get user data to check role
        const userData = await getUserData(result.user.uid);
        if (userData.success) {
          const userRole = userData.data.role;
          console.log("User role:", userRole);
          
          // Redirect based on role
          if (userRole === "admin") {
            navigate("/admin");
          } else if (userRole === "deliveryBoy") {
            navigate("/delivery");
          } else {
            navigate("/");
          }
        } else {
          console.error("Failed to get user data:", userData.error);
          navigate("/");
        }
      } else {
        // Provide more specific error messages based on Firebase error codes
        if (result.error && result.error.includes("user-not-found")) {
          setError("No account found with this email. Please check your email or sign up.");
        } else if (result.error && result.error.includes("wrong-password")) {
          setError("Incorrect password. Please try again or reset your password.");
        } else if (result.error && result.error.includes("too-many-requests")) {
          setError("Too many failed login attempts. Please try again later or reset your password.");
        } else if (result.error && result.error.includes("user-disabled")) {
          setError("This account has been disabled. Please contact support.");
        } else {
          setError(result.error || "Invalid email or password");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      // Handle specific error codes
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email. Please check your email or sign up.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password. Please try again or reset your password.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many failed login attempts. Please try again later or reset your password.");
      } else if (err.code === 'auth/user-disabled') {
        setError("This account has been disabled. Please contact support.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email format. Please enter a valid email address.");
      } else {
        setError(err.message || "An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Google login failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred during Google login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithFacebook();
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Facebook login failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred during Facebook login");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-500">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">Login</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-2 mb-4 border rounded"
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-2 mb-4 border rounded"
            value={password}
            onChange={handlePasswordChange}
            disabled={isLoading}
          />
          <div className="flex justify-end mb-4">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button 
            type="submit" 
            className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4">
          <button 
            className={`w-full bg-blue-800 text-white py-2 rounded mb-2 hover:bg-blue-900 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            onClick={handleFacebookLogin}
            disabled={isLoading}
            type="button"
          >
            Login with Facebook
          </button>
          <button 
            className={`w-full border py-2 rounded hover:bg-gray-100 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
          >
            Login with Google
          </button>
        </div>

        <p className="text-sm text-center mt-4">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
