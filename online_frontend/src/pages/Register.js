import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  signUpWithEmail, 
  signInWithGoogle, 
  isAuthenticated, 
  createUserData,
  updateUserProfile,
  sendEmailVerification,
  checkEmailExists
} from "../firebase";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("customer"); // Add role state
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  
  // Debounce timer for email check
  const [emailCheckTimer, setEmailCheckTimer] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);
  
  // Handle email change with debounced validation
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear any existing email errors when the user types
    setErrors(prev => ({...prev, email: undefined}));
    
    // Clear any existing timer
    if (emailCheckTimer) {
      clearTimeout(emailCheckTimer);
    }
    
    // Only check if email exists if it's a valid email format
    if (newEmail && /\S+@\S+\.\S+/.test(newEmail)) {
      setIsCheckingEmail(true);
      
      // Set a new timer to check after user stops typing for 800ms
      const timer = setTimeout(async () => {
        try {
          const emailCheck = await checkEmailExists(newEmail);
          if (emailCheck.exists) {
            setErrors(prev => ({
              ...prev, 
              email: "This email is already registered. Please use a different email or sign in."
            }));
          }
        } catch (error) {
          console.error("Error checking email:", error);
        } finally {
          setIsCheckingEmail(false);
        }
      }, 800);
      
      setEmailCheckTimer(timer);
    }
  };

  // Validation function
  const validateForm = async () => {
    const newErrors = {};
    
    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email address is invalid";
    } else {
      // Check if email already exists
      setIsLoading(true);
      try {
        const emailCheck = await checkEmailExists(email);
        if (emailCheck.exists) {
          newErrors.email = "This email is already registered. Please use a different email or sign in.";
        }
      } catch (error) {
        console.error("Error checking email:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[!@#$%^&*]/.test(password)) {
      newErrors.password = "Password must contain at least one special character (!@#$%^&*)";
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form (now async)
    setIsLoading(true);
    const isValid = await validateForm();
    if (!isValid) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Register with Firebase
      const result = await signUpWithEmail(email, password);
      
      if (result.success) {
        // Update user profile with name
        await updateUserProfile({ displayName: name });
        
        // Create user data in Firestore with selected role
        await createUserData(result.user, { 
          displayName: name,
          role: role // Use selected role
        });
        
        // Send email verification
        const verificationResult = await sendEmailVerification();
        
        // Also register with backend API
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name,
              email,
              password,
              role: role // Use selected role
            })
          });
          
          if (response.ok) {
            // Registration successful in both Firebase and backend
            if (verificationResult.success) {
              alert("Registration successful! Please check your email to verify your account.");
            } else {
              alert("Registration successful! Please login.");
            }
            navigate("/login");
          } else {
            // Backend registration failed but Firebase succeeded
            // We'll still allow the user to proceed
            console.warn("Backend registration failed, but Firebase registration succeeded");
            if (verificationResult.success) {
              alert("Registration successful! Please check your email to verify your account.");
            } else {
              alert("Registration successful! Please login.");
            }
            navigate("/login");
          }
        } catch (backendErr) {
          console.error("Backend registration error:", backendErr);
          // Still consider registration successful if Firebase succeeded
          if (verificationResult.success) {
            alert("Registration successful! Please check your email to verify your account.");
          } else {
            alert("Registration successful! Please login.");
          }
          navigate("/login");
        }
      } else {
        setErrors({ auth: result.error || "Registration failed" });
      }
    } catch (err) {
      setErrors({
        auth: err.message || "An error occurred during registration"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        // Check if email is already verified (common with Google sign-in)
        if (!result.user.emailVerified) {
          // Send verification email if not already verified
          await sendEmailVerification();
        }
        navigate("/");
      } else {
        setErrors({ 
          auth: result.error || "Google sign-up failed" 
        });
      }
    } catch (error) {
      setErrors({ 
        auth: error.message || "Google sign-up failed" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Facebook signup removed as per requirements

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 py-4">
          <h2 className="text-center text-2xl font-bold text-white">MediHaven</h2>
          <p className="text-center text-blue-100">Create Your Account</p>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Join MediHaven</h1>
            <p className="text-gray-600 mt-1">Sign up to access quality healthcare products</p>
          </div>
          
          {errors.auth && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errors.auth}</p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${errors.name ? "border-red-300" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
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
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${errors.email ? "border-red-300" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full px-3 py-2 border ${errors.password ? "border-red-300" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="••••••••"
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
              {errors.password ? (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full px-3 py-2 border ${errors.confirmPassword ? "border-red-300" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>



            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{" "}
                <button type="button" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </button>
              </label>
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
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
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
                <span className="px-2 bg-white text-gray-500">Or sign up with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button 
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className={`w-full max-w-xs inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                Sign up with Google
              </button>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
