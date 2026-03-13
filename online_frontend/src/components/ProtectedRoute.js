import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserData } from '../firebase'; // Import the function to fetch user data

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // ✅ Debugging: Log currentUser whenever it changes
  useEffect(() => {
    if (currentUser) {
      console.log("User object from context:", currentUser);
    }
  }, [currentUser]);

  // ✅ Fetch user role and check authorization
  useEffect(() => {
    const fetchUserRole = async () => {
      console.log('ProtectedRoute - fetchUserRole started');
      console.log('ProtectedRoute - currentUser:', currentUser);
      console.log('ProtectedRoute - allowedRoles:', allowedRoles);
      
      if (!currentUser) {
        console.log('ProtectedRoute - No currentUser, setting loading false');
        setLoading(false);
        return;
      }

      try {
        console.log('ProtectedRoute - Fetching user data for uid:', currentUser.uid);
        const res = await getUserData(currentUser.uid);
        console.log('ProtectedRoute - User data fetched:', res);
        
        if (res.success && res.data) {
          // Get role and normalize it
          let role = res.data.role ? res.data.role.toString().trim().toLowerCase() : "";
          
          // Normalize delivery roles for consistency
          if (role === "delivery boy" || role === "deliveryboy" || role === "delivery" || role === "deliveryBoy") {
            role = "delivery";
            console.log("ProtectedRoute - Normalized delivery role to 'delivery'");
          }
          
          // Role is used directly below, no need to store in state

          // ✅ Debugging statements
          console.log("ProtectedRoute - Fetched user role:", res.data.role);
          console.log("ProtectedRoute - Normalized role:", role);

          const allowed = allowedRoles.map(r => r.toString().trim().toLowerCase());
          console.log("ProtectedRoute - Allowed roles:", allowed);
          console.log("ProtectedRoute - Current path requires roles:", allowed.length > 0 ? allowed : "any authenticated user");
          console.log("ProtectedRoute - User has role:", role);
          
          const isAuthorized = allowed.length === 0 || allowed.includes(role);
          console.log("ProtectedRoute - Is user authorized for this route?", isAuthorized);
          
          if (isAuthorized) {
            console.log('ProtectedRoute - Setting authorized to true');
            setAuthorized(true);
          } else {
            console.warn("ProtectedRoute - User not authorized. Has role:", role, "Needs one of:", allowed);
            setAuthorized(false);
          }
        } else {
          console.error("ProtectedRoute - Error fetching user data:", res.error);
          setAuthorized(false);
        }
      } catch (error) {
        console.error("ProtectedRoute - Unexpected error fetching user role:", error);
        setAuthorized(false);
      } finally {
        console.log('ProtectedRoute - Setting loading to false');
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [currentUser, allowedRoles]);

  // ✅ Show spinner while loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ✅ Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Redirect to unauthorized if role doesn't match
  if (!authorized) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // ✅ Render protected component if authorized
  return children;
};

export default ProtectedRoute;
