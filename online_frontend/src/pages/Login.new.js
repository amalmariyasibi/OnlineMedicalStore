import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmail, signInWithGoogle, createUserData } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      console.log("Login page - User already logged in:", currentUser);
      
      // Get role and normalize it
      let userRole = (currentUser.role || "").toString().toLowerCase().trim();
      console.log("Login page - Initial user role:", userRole);
      
      // Normalize delivery roles
      if (userRole === "delivery boy" || userRole === "deliveryboy") {
        userRole = "delivery";
        console.log("Login page - Normalized delivery role to:", userRole);
      }
      
      console.log("Login page - Final user role for redirection:", userRole);
      
      if (userRole === "admin") {
        console.log("Login page - Redirecting admin to /admin");
        navigate("/admin", { replace: true });
      } else if (userRole === "delivery") {
        console.log("Login page - Redirecting delivery user to /delivery");
        navigate("/delivery", { replace: true });
      } else {
        console.log("Login page - Redirecting regular user to /user-dashboard");
        navigate("/user-dashboard", { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };


  const redirectByRole = (userRole) => {
    console.log("redirectByRole - Initial role:", userRole);
    
    // Normalize role for consistency
    let normalizedRole = (userRole || "").toString().toLowerCase().trim();
    
    // Normalize delivery roles
    if (normalizedRole === "delivery boy" || normalizedRole === "deliveryboy") {
      normalizedRole = "delivery";
      console.log("redirectByRole - Normalized delivery role to:", normalizedRole);
    }
    
    console.log("redirectByRole - Final normalized role:", normalizedRole);
    
    if (normalizedRole === "admin") {
      console.log("redirectByRole - Redirecting admin to /admin");
      navigate("/admin", { replace: true });
    } else if (normalizedRole === "delivery") {
      console.log("redirectByRole - Redirecting delivery user to /delivery");
      navigate("/delivery", { replace: true });
    } else {
      console.log("redirectByRole - Redirecting regular user to /user-dashboard");
      navigate("/user-dashboard", { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Attempting to sign in with email:", email);
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        console.log("Login successful, ensuring user doc and role");

        // Ensure user doc exists and auto-assign role if needed
        const writeRes = await createUserData(result.user);
        if (!writeRes.success) {
          throw new Error(writeRes.error || "Failed to update user profile");
        }

        let effectiveRole = writeRes.role;
        console.log("Login handleSubmit - Initial role from writeRes:", effectiveRole);
        
        // Normalize delivery roles
        if (effectiveRole === "delivery boy" || effectiveRole === "deliveryboy") {
          effectiveRole = "delivery";
          console.log("Login handleSubmit - Normalized delivery role to:", effectiveRole);
        }
        
        console.log("Login handleSubmit - Final role for redirection:", effectiveRole);
        
        // Force a small delay to ensure the role is properly set in the auth context
        setTimeout(() => {
          console.log("Login handleSubmit - Redirecting after timeout with role:", effectiveRole);
          redirectByRole(effectiveRole);
        }, 1000);
      } else {
        console.error("Login failed:", result.error);
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Attempting to sign in with Google");
      const result = await signInWithGoogle();
      
      if (result.success) {
        console.log("Google login successful, ensuring user doc and role");
        const writeRes = await createUserData(result.user);
        if (!writeRes.success) {
          throw new Error(writeRes.error || "Failed to update user profile");
        }
        // Force a small delay to ensure the role is properly set in the auth context
        setTimeout(() => {
          redirectByRole(writeRes.role);
        }, 500);
      } else {
        console.error("Google login failed:", result.error);
        setError(result.error || "Google login failed");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.message || "An error occurred during Google login");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 py-4">
          <h2 className="text-center text-2xl font-bold text-white">MediHaven</h2>
          <p className="text-center text-blue-100">Sign In to Your Account</p>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600 mt-1">Sign in to access quality healthcare products</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign in with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;