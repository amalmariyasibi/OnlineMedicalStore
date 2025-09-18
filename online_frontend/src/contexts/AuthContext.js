import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, getUserData } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      try {
        if (authUser) {
          // Get user role from Firestore
          const userDataResult = await getUserData(authUser.uid);
          if (userDataResult.success) {
            // Normalize role for consistency
            let role = userDataResult.data.role ? userDataResult.data.role.toString().trim().toLowerCase() : "";
            if (role === "delivery boy" || role === "deliveryboy") {
              role = "delivery";
            }
            // Add normalized role to the user object
            authUser.role = role;
            console.log("AuthContext - User role normalized:", userDataResult.data.role, "->", role);
          }
          
          setCurrentUser(authUser);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Error in auth state change:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  const value = {
    currentUser,
    loading,
    error
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}