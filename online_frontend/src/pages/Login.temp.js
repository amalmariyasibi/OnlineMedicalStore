import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmail, signInWithGoogle, signInWithFacebook } from "../firebase";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithEmail(email, password);
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError(err.message || "An error occurred during login");
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
          >
            Login with Facebook
          </button>
          <button 
            className={`w-full border py-2 rounded hover:bg-gray-100 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            Login with Google
          </button>
        </div>

        <p className="text-sm text-center mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
