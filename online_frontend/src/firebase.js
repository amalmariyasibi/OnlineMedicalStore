import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged as firebaseAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  addDoc,
  orderBy,
  Timestamp,
  limit,
  onSnapshot
} from "firebase/firestore";
import { 
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { getMessaging, getToken as getFcmToken, onMessage as onFcmMessage, isSupported as isMessagingSupported } from "firebase/messaging";

// Import Firebase config
import { auth, db, storage } from './firebaseConfig';

// Export db and storage for direct access
export { db, storage };

// --- Firebase Cloud Messaging (Web) helpers ---
let messagingInstance = null;
const initMessaging = async () => {
  try {
    if (!(await isMessagingSupported())) return null;
    if (messagingInstance) return messagingInstance;
    messagingInstance = getMessaging();
    // Register SW if not already
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      // associate messaging with this SW
      // getMessaging() in v9 automatically uses default SW; explicit useServiceWorker not needed
    }
    return messagingInstance;
  } catch (e) {
    console.warn('Messaging not supported or failed to init:', e?.message);
    return null;
  }
};

export const requestAndSaveFcmToken = async (userId) => {
  try {
    const m = await initMessaging();
    if (!m || !userId) return { success: false, error: 'Messaging unsupported or missing user' };
    const vapidKey = 'BOaXWfQ8wRmSy-7HpSuQutlMpGNcfssfh0jBAh3nrfBWmRDts9FlfbX7wAKSbsI6l3Lxizli50qFnGV-lQLg33o';
    const token = await getFcmToken(m, { vapidKey });
    if (!token) return { success: false, error: 'No FCM token (permission denied?)' };
    // Save token into users/{uid}.fcmTokens (array union)
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? (snap.data().fcmTokens || []) : [];
    if (!existing.includes(token)) {
      await updateDoc(userRef, { fcmTokens: [...existing, token], updatedAt: new Date() }).catch(async () => {
        await setDoc(userRef, { fcmTokens: [token], updatedAt: new Date() }, { merge: true });
      });
    }
    return { success: true, token };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const onForegroundNotification = async (handler) => {
  const m = await initMessaging();
  if (!m) return () => {};
  return onFcmMessage(m, handler);
};

// Default system settings
const DEFAULT_SETTINGS = {
  storeName: "MediHaven",
  storeEmail: "contact@medihaven.com",
  storePhone: "+91 1234567890",
  storeAddress: "123 Medical Avenue, Healthcare District",
  enablePrescriptionVerification: true,
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  taxRate: 5,
  shippingFee: 50,
  freeShippingThreshold: 500,
  currency: "₹",
  allowGuestCheckout: true,
  maintenanceMode: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Generate a random OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let OTP = '';
  
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  
  return OTP;
};

// Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Facebook provider
const facebookProvider = new FacebookAuthProvider();

// Admin allowlist (comma-separated emails). Example: REACT_APP_ADMIN_EMAILS=admin@example.com,owner@company.com
const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in with Facebook
export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign out
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

// Auth state observer
export const onAuthStateChanged = (callback) => {
  return firebaseAuthStateChanged(auth, callback);
};

// Check if email already exists
export const checkEmailExists = async (email) => {
  try {
    // Query Firestore to check if the email exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    // If we found any documents with this email, it exists
    if (!querySnapshot.empty) {
      return { exists: true };
    }
    
    // Try to sign in with an invalid password to check if the email exists in Auth
    // This will fail, but the error code will tell us if the email exists
    try {
      await signInWithEmailAndPassword(auth, email, "dummy-password-for-check");
      // If we get here, something went wrong (should never happen)
      return { exists: true };
    } catch (authError) {
      // auth/user-not-found means the email doesn't exist
      // auth/wrong-password means the email exists but password is wrong
      if (authError.code === 'auth/user-not-found') {
        return { exists: false };
      } else if (authError.code === 'auth/wrong-password') {
        return { exists: true };
      } else {
        // For other errors, we'll assume the email doesn't exist
        console.log("Auth error during email check:", authError.code);
        return { exists: false };
      }
    }
  } catch (error) {
    console.error("Error checking if email exists:", error);
    // In case of error, we'll return false to allow the registration attempt
    return { exists: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send email verification
export const sendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await firebaseSendEmailVerification(user);
      return { success: true };
    }
    return { success: false, error: "No user is signed in" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, profileData);
      
      // Update user data in Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { 
        displayName: profileData.displayName || user.displayName,
        photoURL: profileData.photoURL || user.photoURL,
        updatedAt: new Date()
      }, { merge: true });
      
      return { success: true };
    }
    return { success: false, error: "No user is signed in" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user email
export const updateUserEmail = async (newEmail, password) => {
  try {
    const user = auth.currentUser;
    if (user) {
      // Re-authenticate user before changing email
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, newEmail);
      
      // Update user data in Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { 
        email: newEmail,
        updatedAt: new Date()
      });
      
      return { success: true };
    }
    return { success: false, error: "No user is signed in" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user password
export const updateUserPassword = async (newPassword, currentPassword) => {
  try {
    const user = auth.currentUser;
    if (user) {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      return { success: true };
    }
    return { success: false, error: "No user is signed in" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    // In a real application, this would be a Cloud Function or Admin SDK operation
    // For this example, we'll simulate it by fetching from Firestore
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, role) => {
  try {
    // Update user role in Firestore
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { 
      role,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  try {
    // In a real application, this would be a Cloud Function or Admin SDK operation
    // For this example, we'll just delete from Firestore
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create or update user data in Firestore after registration/login
export const createUserData = async (user, additionalData = {}) => {
  try {
    console.log("Creating/updating user data for:", user.uid);
    console.log("Additional data:", additionalData);
    
    const userRef = doc(db, "users", user.uid);
    
    // First check if user already exists
    const userSnap = await getDoc(userRef);
    const userExists = userSnap.exists();
    
    // Determine role
    let role = additionalData.role;
    if (userExists && !role) {
      const existingData = userSnap.data();
      let existingRole = existingData.role || "customer";
      
      // Normalize delivery roles for consistency
      if (existingRole === "delivery boy" || existingRole === "deliveryboy") {
        existingRole = "delivery";
        console.log("Normalized existing delivery role to 'delivery'");
      }
      
      role = existingRole;
      console.log("User exists, keeping existing role:", role);
    } else if (role === "delivery boy" || role === "deliveryboy") {
      // Also normalize the role if it's explicitly provided
      role = "delivery";
      console.log("Normalized provided delivery role to 'delivery'");
    } else if (!role) {
      // Automatic role assignment on first login if no explicit role provided
      const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
      
      // Check if email contains delivery or deliveryboy for automatic assignment
      const userEmail = (user.email || "").toLowerCase();
      const isDelivery = userEmail.includes("delivery") || 
                         userEmail.includes("deliveryboy");
      
      console.log("Checking if user is delivery:", userEmail, "contains delivery terms:", isDelivery);
      
      if (isAdmin) {
        role = "admin";
        console.log("User assigned admin role based on email allowlist");
      } else if (isDelivery) {
        // Use consistent role name for delivery users
        role = "delivery";
        console.log("User assigned delivery role based on email pattern");
      } else {
        role = "customer";
        console.log("User assigned default customer role");
      }
      
      console.log("Auto-assigned role:", role, "for email:", user.email);
    }
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || additionalData.displayName || "",
      photoURL: user.photoURL || "",
      emailVerified: user.emailVerified,
      role: role,
      updatedAt: new Date()
    };
    
    // Only set createdAt if this is a new user
    if (!userExists) {
      userData.createdAt = new Date();
    }
    
    console.log("Saving user data:", userData);
    await setDoc(userRef, userData, { merge: true });
    console.log("User data saved successfully");
    console.log("Final role assigned to user:", role);
    
    return { success: true, role: role };
  } catch (error) {
    console.error("Error creating/updating user data:", error);
    return { success: false, error: error.message };
  }
};

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: "User data not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Product Management Functions

// Get all products
export const getAllProducts = async (filters = {}) => {
  try {
    let productsQuery = collection(db, "products");
    
    // Apply category filter if provided
    if (filters.category && filters.category !== "all") {
      productsQuery = query(productsQuery, where("category", "==", filters.category));
    }
    
    // Apply prescription filter if provided
    if (filters.requiresPrescription !== undefined) {
      productsQuery = query(productsQuery, where("requiresPrescription", "==", filters.requiresPrescription));
    }
    
    // Apply availability filter if provided
    if (filters.inStock !== undefined) {
      productsQuery = query(productsQuery, where("stockQuantity", ">", 0));
    }
    
    const querySnapshot = await getDocs(productsQuery);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Apply search filter if provided (client-side filtering)
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      return { 
        success: true, 
        products: products.filter(product => 
          product.name.toLowerCase().includes(searchTermLower) ||
          product.description?.toLowerCase().includes(searchTermLower) ||
          (product.manufacturer && product.manufacturer.toLowerCase().includes(searchTermLower)) ||
          (product.category && product.category.toLowerCase().includes(searchTermLower))
        )
      };
    }
    
    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get product by ID (checks both products and medicines collections)
export const getProductById = async (productId) => {
  try {
    // First check products collection
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      return { 
        success: true, 
        product: {
          id: productSnap.id,
          ...productSnap.data()
        }
      };
    } 
    
    // If not found in products, check medicines collection
    const medicineRef = doc(db, "medicines", productId);
    const medicineSnap = await getDoc(medicineRef);
    
    if (medicineSnap.exists()) {
      const data = medicineSnap.data();
      
      // Convert Firestore Timestamp to JavaScript Date
      if (data.expiryDate) {
        try {
          data.expiryDate = data.expiryDate.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate);
        } catch (e) {
          console.error("Error converting expiryDate:", e);
          // Set a future date to ensure it's not marked as expired
          data.expiryDate = new Date(2030, 0, 1);
        }
      }
      
      if (data.manufacturingDate) {
        try {
          data.manufacturingDate = data.manufacturingDate.toDate ? data.manufacturingDate.toDate() : new Date(data.manufacturingDate);
        } catch (e) {
          console.error("Error converting manufacturingDate:", e);
          data.manufacturingDate = new Date(2020, 0, 1);
        }
      }
      
      return { 
        success: true, 
        product: {
          id: medicineSnap.id,
          ...data
        }
      };
    }
    
    // Not found in either collection
    return { success: false, error: "Product not found" };
  } catch (error) {
    console.error("Error in getProductById:", error);
    return { success: false, error: error.message };
  }
};

// Add new product
export const addProduct = async (productData) => {
  try {
    // Validate required fields
    if (!productData.name || !productData.price || !productData.category) {
      return { success: false, error: "Name, price, and category are required" };
    }
    
    // Add timestamps
    const productWithTimestamps = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const productRef = await addDoc(collection(db, "products"), productWithTimestamps);
    
    return { 
      success: true, 
      productId: productRef.id,
      message: "Product added successfully" 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update product
export const updateProduct = async (productId, productData) => {
  try {
    const productRef = doc(db, "products", productId);
    
    // Add updated timestamp
    const updatedData = {
      ...productData,
      updatedAt: new Date()
    };
    
    await updateDoc(productRef, updatedData);
    
    return { 
      success: true, 
      message: "Product updated successfully" 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
    
    return { 
      success: true, 
      message: "Product deleted successfully" 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all product categories
export const getProductCategories = async () => {
  try {
    // This is a simplified approach - in a real app, you might have a separate categories collection
    const productsQuery = collection(db, "products");
    const querySnapshot = await getDocs(productsQuery);
    
    // Extract unique categories
    const categories = new Set();
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      if (product.category) {
        categories.add(product.category);
      }
    });
    
    return { 
      success: true, 
      categories: Array.from(categories) 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Medicine Management Functions

// Get all medicines
export const getAllMedicines = async (filters = {}) => {
  try {
    let medicinesQuery = collection(db, "medicines");
    
    // Apply category filter if provided
    if (filters.category && filters.category !== "all") {
      medicinesQuery = query(medicinesQuery, where("category", "==", filters.category));
    }
    
    // Apply prescription filter if provided
    if (filters.requiresPrescription !== undefined) {
      medicinesQuery = query(medicinesQuery, where("requiresPrescription", "==", filters.requiresPrescription));
    }
    
    // Apply availability filter if provided
    if (filters.inStock !== undefined) {
      medicinesQuery = query(medicinesQuery, where("stockQuantity", ">", 0));
    }
    
    // Apply expiry filter if provided (only show non-expired medicines)
    if (filters.nonExpired) {
      const today = new Date();
      medicinesQuery = query(medicinesQuery, where("expiryDate", ">", today));
    }
    
    const querySnapshot = await getDocs(medicinesQuery);
    const medicines = [];
    
    querySnapshot.forEach((doc) => {
      // Convert Firestore Timestamp to JavaScript Date
      const data = doc.data();
      if (data.expiryDate) {
        data.expiryDate = data.expiryDate.toDate();
      }
      if (data.manufacturingDate) {
        data.manufacturingDate = data.manufacturingDate.toDate();
      }
      if (data.createdAt) {
        data.createdAt = data.createdAt.toDate();
      }
      if (data.updatedAt) {
        data.updatedAt = data.updatedAt.toDate();
      }
      
      medicines.push({
        id: doc.id,
        ...data
      });
    });
    
    // Apply search filter if provided (client-side filtering)
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      return { 
        success: true, 
        medicines: medicines.filter(medicine => 
          medicine.name.toLowerCase().includes(searchTermLower) ||
          medicine.description.toLowerCase().includes(searchTermLower) ||
          (medicine.manufacturer && medicine.manufacturer.toLowerCase().includes(searchTermLower)) ||
          (medicine.genericName && medicine.genericName.toLowerCase().includes(searchTermLower))
        )
      };
    }
    
    return { success: true, medicines };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get medicine by ID
export const getMedicineById = async (medicineId) => {
  try {
    console.log("Getting medicine by ID:", medicineId);
    const medicineRef = doc(db, "medicines", medicineId);
    
    try {
      const medicineSnap = await getDoc(medicineRef);
      
      if (medicineSnap.exists()) {
        const data = medicineSnap.data();
        console.log("Medicine data retrieved:", data);
        
        // Convert Firestore Timestamp to JavaScript Date
        if (data.expiryDate) {
          try {
            data.expiryDate = data.expiryDate.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate);
            console.log("Converted expiryDate:", data.expiryDate);
          } catch (e) {
            console.error("Error converting expiryDate:", e);
            // Set a future date to ensure it's not marked as expired
            data.expiryDate = new Date(2030, 0, 1);
          }
        }
        
        if (data.manufacturingDate) {
          try {
            data.manufacturingDate = data.manufacturingDate.toDate ? data.manufacturingDate.toDate() : new Date(data.manufacturingDate);
          } catch (e) {
            console.error("Error converting manufacturingDate:", e);
            data.manufacturingDate = new Date(2020, 0, 1);
          }
        }
        
        if (data.createdAt) {
          try {
            data.createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          } catch (e) {
            console.error("Error converting createdAt:", e);
          }
        }
        
        if (data.updatedAt) {
          try {
            data.updatedAt = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
          } catch (e) {
            console.error("Error converting updatedAt:", e);
          }
        }
        
        return { 
          success: true, 
          medicine: {
            id: medicineSnap.id,
            ...data
          }
        };
      } else {
        console.warn("Medicine not found:", medicineId);
        return { success: false, error: "Medicine not found" };
      }
    } catch (docError) {
      console.error("Error getting document:", docError);
      
      // Check if it's an offline error
      if (docError.message && docError.message.includes("offline")) {
        return { 
          success: false, 
          error: "You appear to be offline. Please check your internet connection and try again.",
          isOffline: true
        };
      }
      
      throw docError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error("getMedicineById error:", error);
    return { 
      success: false, 
      error: error.message || "An error occurred while fetching the medicine"
    };
  }
};

// Add new medicine
export const addMedicine = async (medicineData) => {
  try {
    // Validate required fields
    if (!medicineData.name || !medicineData.price || !medicineData.category) {
      return { success: false, error: "Name, price, and category are required" };
    }
    
    // Convert JavaScript Date to Firestore Timestamp
    const dataToSave = { ...medicineData };
    
    if (dataToSave.expiryDate) {
      dataToSave.expiryDate = new Date(dataToSave.expiryDate);
    }
    
    if (dataToSave.manufacturingDate) {
      dataToSave.manufacturingDate = new Date(dataToSave.manufacturingDate);
    }
    
    // Add timestamps
    dataToSave.createdAt = new Date();
    dataToSave.updatedAt = new Date();
    
    const medicineRef = await addDoc(collection(db, "medicines"), dataToSave);
    
    return { 
      success: true, 
      medicineId: medicineRef.id,
      message: "Medicine added successfully" 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update medicine
export const updateMedicine = async (medicineId, medicineData) => {
  try {
    const medicineRef = doc(db, "medicines", medicineId);
    
    // Convert JavaScript Date to Firestore Timestamp
    const dataToUpdate = { ...medicineData };
    
    if (dataToUpdate.expiryDate) {
      dataToUpdate.expiryDate = new Date(dataToUpdate.expiryDate);
    }
    
    if (dataToUpdate.manufacturingDate) {
      dataToUpdate.manufacturingDate = new Date(dataToUpdate.manufacturingDate);
    }
    
    // Add updated timestamp
    dataToUpdate.updatedAt = new Date();
    
    await updateDoc(medicineRef, dataToUpdate);
    
    return { 
      success: true, 
      message: "Medicine updated successfully" 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete medicine
export const deleteMedicine = async (medicineId) => {
  try {
    const medicineRef = doc(db, "medicines", medicineId);
    await deleteDoc(medicineRef);
    
    return { 
      success: true, 
      message: "Medicine deleted successfully" 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all medicine categories
export const getMedicineCategories = async () => {
  try {
    // This is a simplified approach - in a real app, you might have a separate categories collection
    const medicinesQuery = collection(db, "medicines");
    const querySnapshot = await getDocs(medicinesQuery);
    
    // Extract unique categories
    const categories = new Set();
    querySnapshot.forEach((doc) => {
      const medicine = doc.data();
      if (medicine.category) {
        categories.add(medicine.category);
      }
    });
    
    return { 
      success: true, 
      categories: Array.from(categories) 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Check for expiring medicines
export const getExpiringMedicines = async (daysThreshold = 90) => {
  try {
    const medicinesQuery = collection(db, "medicines");
    const querySnapshot = await getDocs(medicinesQuery);
    
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    const expiringMedicines = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.expiryDate) {
        const expiryDate = data.expiryDate.toDate();
        if (expiryDate > today && expiryDate < thresholdDate) {
          expiringMedicines.push({
            id: doc.id,
            ...data,
            expiryDate: expiryDate,
            daysUntilExpiry: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });
    
    return { 
      success: true, 
      medicines: expiringMedicines 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get low stock medicines
export const getLowStockMedicines = async (threshold = 10) => {
  try {
    const medicinesQuery = query(
      collection(db, "medicines"),
      where("stockQuantity", "<=", threshold),
      where("stockQuantity", ">", 0)
    );
    
    const querySnapshot = await getDocs(medicinesQuery);
    const lowStockMedicines = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.expiryDate) {
        data.expiryDate = data.expiryDate.toDate();
      }
      lowStockMedicines.push({
        id: doc.id,
        ...data
      });
    });
    
    return { 
      success: true, 
      medicines: lowStockMedicines 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Search products and medicines
export const searchProducts = async (query) => {
  try {
    console.log("Search query:", query);
    
    if (!query || query.trim() === "") {
      console.log("Empty query, returning empty results");
      return { success: true, products: [] };
    }
    
    const searchTermLower = query.toLowerCase();
    console.log("Searching for:", searchTermLower);
    
    const products = [];
    
    try {
      // Get all products
      const productsQuery = collection(db, "products");
      const productsSnapshot = await getDocs(productsQuery);
      
      console.log("Total products found:", productsSnapshot.size);
      
      productsSnapshot.forEach((doc) => {
        const product = {
          id: doc.id,
          ...doc.data()
        };
        
        // Always add product to the array, we'll filter later
        products.push(product);
      });
      
      // Get all medicines
      const medicinesQuery = collection(db, "medicines");
      const medicinesSnapshot = await getDocs(medicinesQuery);
      
      console.log("Total medicines found:", medicinesSnapshot.size);
      
      medicinesSnapshot.forEach((doc) => {
        const medicine = {
          id: doc.id,
          ...doc.data()
        };
        
        // Convert Firestore timestamps to JavaScript dates
        if (medicine.expiryDate) {
          try {
            medicine.expiryDate = medicine.expiryDate.toDate ? medicine.expiryDate.toDate() : new Date(medicine.expiryDate);
          } catch (e) {
            console.error("Error converting expiryDate:", e);
            medicine.expiryDate = new Date(2030, 0, 1);
          }
        }
        
        if (medicine.manufacturingDate) {
          try {
            medicine.manufacturingDate = medicine.manufacturingDate.toDate ? medicine.manufacturingDate.toDate() : new Date(medicine.manufacturingDate);
          } catch (e) {
            console.error("Error converting manufacturingDate:", e);
            medicine.manufacturingDate = new Date(2020, 0, 1);
          }
        }
        
        // Always add medicine to the array, we'll filter later
        products.push(medicine);
      });
    } catch (fetchError) {
      console.error("Error fetching products/medicines:", fetchError);
      
      // Check if it's an offline error
      if (fetchError.message && fetchError.message.includes("offline")) {
        return { 
          success: false, 
          error: "You appear to be offline. Please check your internet connection and try again.",
          isOffline: true
        };
      }
      
      throw fetchError; // Re-throw to be caught by the outer catch
    }
    
    // Debug: Log all products before filtering
    console.log("All products before filtering:", products.map(p => p.name));
    
    // Filter products by search term
    const filteredProducts = products.filter(product => {
      const nameMatch = product.name && product.name.toLowerCase().includes(searchTermLower);
      const descMatch = product.description && product.description.toLowerCase().includes(searchTermLower);
      const manuMatch = product.manufacturer && product.manufacturer.toLowerCase().includes(searchTermLower);
      const catMatch = product.category && product.category.toLowerCase().includes(searchTermLower);
      
      const matches = nameMatch || descMatch || manuMatch || catMatch;
      
      console.log(`Product: ${product.name}, Matches: ${matches} (name: ${nameMatch}, desc: ${descMatch}, manu: ${manuMatch}, cat: ${catMatch})`);
      
      return matches;
    });
    
    console.log("Total search results:", filteredProducts.length);
    return { success: true, products: filteredProducts };
  } catch (error) {
    console.error("Search error:", error);
    return { 
      success: false, 
      error: error.message || "An error occurred while searching",
      isOffline: error.message && error.message.includes("offline")
    };
  }
};

// --- Smart Recommendation Helpers (KNN-style on top of Firestore data) ---
const textMatchScore = (a, b) => {
  if (!a || !b) return 0;
  const la = a.toString().toLowerCase();
  const lb = b.toString().toLowerCase();
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.8;
  return 0;
};

const priceSimilarity = (basePrice, otherPrice) => {
  const a = Number(basePrice) || 0;
  const b = Number(otherPrice) || 0;
  if (!a || !b) return 0;
  const diff = Math.abs(a - b);
  const avg = (a + b) / 2;
  if (!avg) return 0;
  const ratio = diff / avg;
  if (ratio < 0.1) return 1;      // almost same price
  if (ratio < 0.25) return 0.6;   // within 25%
  if (ratio < 0.5) return 0.3;    // within 50%
  return 0;
};

const computeMedicineSimilarity = (base, candidate) => {
  if (!base || !candidate || base.id === candidate.id) return 0;
  let score = 0;

  score += textMatchScore(base.genericName, candidate.genericName) * 5;
  score += textMatchScore(base.category, candidate.category) * 3;
  score += textMatchScore(base.manufacturer, candidate.manufacturer) * 2;
  score += textMatchScore(base.dosage, candidate.dosage) * 1.5;
  score += textMatchScore(base.sideEffects, candidate.sideEffects);
  score += priceSimilarity(base.price, candidate.price);

  if (base.requiresPrescription === candidate.requiresPrescription) {
    score += 1;
  }

  return score;
};

// Suggest alternative & generic medicines for a given medicine
export const getAlternativeMedicines = async (medicineId, options = {}) => {
  try {
    const { maxResults = 8, preferCheaper = true } = options;

    const targetResult = await getMedicineById(medicineId);
    if (!targetResult.success) {
      return { success: false, error: targetResult.error || "Medicine not found" };
    }

    const baseMedicine = targetResult.medicine;
    const medicinesResult = await getAllMedicines({ nonExpired: true, inStock: true });
    if (!medicinesResult.success) {
      return { success: false, error: medicinesResult.error || "Failed to load medicines" };
    }

    const candidates = medicinesResult.medicines.filter(m => m.id !== baseMedicine.id && (m.stockQuantity || 0) > 0);

    const scored = candidates
      .map(m => ({
        medicine: m,
        score: computeMedicineSimilarity(baseMedicine, m)
      }))
      .filter(item => item.score > 0);

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (preferCheaper) {
        return (Number(a.medicine.price) || 0) - (Number(b.medicine.price) || 0);
      }
      return 0;
    });

    const alternatives = scored.slice(0, maxResults).map(item => item.medicine);
    return { success: true, alternatives, baseMedicine };
  } catch (error) {
    console.error("getAlternativeMedicines error:", error);
    return { success: false, error: error.message || "Failed to get alternative medicines" };
  }
};

// Suggest alternative & generic products (for items stored in products collection)
export const getAlternativeProducts = async (productId, options = {}) => {
  try {
    const { maxResults = 8, preferCheaper = true } = options;

    const baseResult = await getProductById(productId);
    if (!baseResult.success) {
      return { success: false, error: baseResult.error || "Product not found" };
    }

    const base = baseResult.product;
    const allResult = await getAllProducts({ inStock: true });
    if (!allResult.success) {
      return { success: false, error: allResult.error || "Failed to load products" };
    }

    const candidates = (allResult.products || []).filter(p => p.id !== base.id && (p.stockQuantity || 0) > 0);

    const scored = candidates
      .map(p => ({
        product: p,
        score: computeMedicineSimilarity(
          {
            id: base.id,
            genericName: base.genericName || base.name,
            category: base.category,
            manufacturer: base.manufacturer,
            dosage: base.dosage,
            sideEffects: base.sideEffects,
            price: base.price,
            requiresPrescription: base.requiresPrescription || false
          },
          {
            id: p.id,
            genericName: p.genericName || p.name,
            category: p.category,
            manufacturer: p.manufacturer,
            dosage: p.dosage,
            sideEffects: p.sideEffects,
            price: p.price,
            requiresPrescription: p.requiresPrescription || false
          }
        )
      }))
      .filter(item => item.score > 0);

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (preferCheaper) {
        return (Number(a.product.price) || 0) - (Number(b.product.price) || 0);
      }
      return 0;
    });

    const alternatives = scored.slice(0, maxResults).map(item => item.product);
    return { success: true, alternatives, baseProduct: base };
  } catch (error) {
    console.error("getAlternativeProducts error:", error);
    return { success: false, error: error.message || "Failed to get alternative products" };
  }
};

// Personalized "Recommended for You" using purchase history + similarity
export const getRecommendedForUser = async (userId, options = {}) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const { maxResults = 10 } = options;
    const ordersResult = await getUserOrders(userId);
    if (!ordersResult.success) {
      return { success: false, error: ordersResult.error || "Failed to load user orders" };
    }

    const frequency = new Map();
    const purchasedIds = new Set();

    ordersResult.orders.forEach(order => {
      (order.items || []).forEach(item => {
        const id = item.id || item.productId || item.medicineId;
        if (!id) return;
        const qty = Number(item.quantity) || 1;
        purchasedIds.add(id);
        frequency.set(id, (frequency.get(id) || 0) + qty);
      });
    });

    // Cold start: no orders yet -> suggest cheap in-stock items
    if (!frequency.size) {
      const topProducts = await getAllProducts({ inStock: true });
      const topMeds = await getAllMedicines({ inStock: true, nonExpired: true });
      if (!topProducts.success && !topMeds.success) {
        return { success: false, error: topProducts.error || topMeds.error || "No products available" };
      }
      const combined = [
        ...(topProducts.success ? topProducts.products : []),
        ...(topMeds.success ? topMeds.medicines : [])
      ].filter(item => (item.stockQuantity || 0) > 0);

      combined.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      return { success: true, recommendations: combined.slice(0, maxResults) };
    }

    // Use top-k frequently purchased medicines as anchors
    const purchasesByFrequency = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const allMedsResult = await getAllMedicines({ inStock: true, nonExpired: true });
    const allProductsResult = await getAllProducts({ inStock: true });

    if (!allMedsResult.success && !allProductsResult.success) {
      return { success: false, error: allMedsResult.error || allProductsResult.error || "Failed to load catalog" };
    }

    const medicineMap = new Map();
    (allMedsResult.medicines || []).forEach(m => medicineMap.set(m.id, m));

    const baseLiked = purchasesByFrequency
      .map(id => medicineMap.get(id))
      .filter(Boolean);

    const scoredCandidates = [];

    // Candidate medicines
    (allMedsResult.medicines || []).forEach(med => {
      if (purchasedIds.has(med.id) || (med.stockQuantity || 0) <= 0) return;
      let best = 0;
      baseLiked.forEach(base => {
        const s = computeMedicineSimilarity(base, med);
        if (s > best) best = s;
      });
      if (best > 0) {
        scoredCandidates.push({ item: med, score: best });
      }
    });

    // Candidate non-medicine products treated as pseudo-medicines
    (allProductsResult.products || []).forEach(prod => {
      if ((prod.stockQuantity || 0) <= 0) return;
      const pseudoMed = {
        id: prod.id,
        name: prod.name,
        genericName: prod.genericName || prod.name,
        category: prod.category,
        manufacturer: prod.manufacturer,
        dosage: prod.dosage,
        sideEffects: prod.sideEffects,
        price: prod.price,
        requiresPrescription: prod.requiresPrescription || false
      };
      let best = 0;
      baseLiked.forEach(base => {
        const s = computeMedicineSimilarity(base, pseudoMed);
        if (s > best) best = s;
      });
      if (best > 0) {
        scoredCandidates.push({ item: prod, score: best });
      }
    });

    // If no similarity-based candidates, fall back to cheap items
    if (!scoredCandidates.length) {
      const fallback = [
        ...(allMedsResult.medicines || []),
        ...(allProductsResult.products || [])
      ].filter(item => (item.stockQuantity || 0) > 0 && !purchasedIds.has(item.id));

      fallback.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      return { success: true, recommendations: fallback.slice(0, maxResults) };
    }

    // Sort by similarity, then by price (cheaper first)
    scoredCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (Number(a.item.price) || 0) - (Number(b.item.price) || 0);
    });

    const seen = new Set();
    const recommendations = [];
    for (const candidate of scoredCandidates) {
      if (recommendations.length >= maxResults) break;
      if (seen.has(candidate.item.id)) continue;
      seen.add(candidate.item.id);
      recommendations.push(candidate.item);
    }

    return { success: true, recommendations };
  } catch (error) {
    console.error("getRecommendedForUser error:", error);
    return { success: false, error: error.message || "Failed to get recommendations" };
  }
};

// Prescription Management Functions

// Upload a prescription
export const uploadPrescription = async (userId, file, metadata = {}) => {
  try {
    if (!userId || !file) {
      return { success: false, error: "User ID and file are required" };
    }

    // Create a reference to the file in Firebase Storage
    const fileExtension = file.name.split('.').pop();
    const fileName = `prescriptions/${userId}/${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const fileURL = await getDownloadURL(snapshot.ref);

    // Create a new prescription document in Firestore
    const prescriptionData = {
      userId,
      fileName,
      fileURL,
      fileType: file.type,
      fileSize: file.size,
      status: "pending", // pending, approved, rejected
      notes: "",
      metadata: metadata || {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Get user data to include in the prescription document
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      prescriptionData.user = {
        displayName: userDoc.data().displayName || "",
        email: userDoc.data().email || "",
        phoneNumber: userDoc.data().phoneNumber || ""
      };
    }

    const prescriptionRef = await addDoc(collection(db, "prescriptions"), prescriptionData);
    
    return { 
      success: true, 
      prescriptionId: prescriptionRef.id,
      prescription: { id: prescriptionRef.id, ...prescriptionData }
    };
  } catch (error) {
    console.error("Error uploading prescription:", error);
    return { success: false, error: error.message || "Failed to upload prescription" };
  }
};

// Get all prescriptions (admin only)
export const getAllPrescriptions = async (filters = {}) => {
  try {
    // Start with a base query
    let prescriptionsQuery = collection(db, "prescriptions");
    
    // Apply filters if provided
    const queryFilters = [];
    
    if (filters.status && filters.status !== "all") {
      queryFilters.push(where("status", "==", filters.status));
    }
    
    if (filters.userId) {
      queryFilters.push(where("userId", "==", filters.userId));
    }
    
    // Apply sorting (newest first by default)
    const sortField = filters.sortBy || "createdAt";
    const sortDirection = filters.sortDirection || "desc";
    
    // Build the query
    if (queryFilters.length > 0) {
      prescriptionsQuery = query(
        prescriptionsQuery, 
        ...queryFilters, 
        orderBy(sortField, sortDirection)
      );
    } else {
      prescriptionsQuery = query(
        prescriptionsQuery, 
        orderBy(sortField, sortDirection)
      );
    }
    
    // Apply limit if provided
    if (filters.limit) {
      prescriptionsQuery = query(prescriptionsQuery, limit(filters.limit));
    }
    
    // Execute the query
    const querySnapshot = await getDocs(prescriptionsQuery);
    
    // Process the results
    const prescriptions = [];
    querySnapshot.forEach((doc) => {
      prescriptions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, prescriptions };
  } catch (error) {
    console.error("Error getting prescriptions:", error);
    return { success: false, error: error.message || "Failed to get prescriptions" };
  }
};

// Get prescriptions for a specific user
export const getUserPrescriptions = async (userId, filters = {}) => {
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }
  
  // Add userId to filters
  return getAllPrescriptions({ ...filters, userId });
};

// Get a specific prescription by ID
export const getPrescriptionById = async (prescriptionId) => {
  try {
    if (!prescriptionId) {
      return { success: false, error: "Prescription ID is required" };
    }
    
    const prescriptionDoc = await getDoc(doc(db, "prescriptions", prescriptionId));
    
    if (!prescriptionDoc.exists()) {
      return { success: false, error: "Prescription not found" };
    }
    
    return { 
      success: true, 
      prescription: {
        id: prescriptionDoc.id,
        ...prescriptionDoc.data()
      }
    };
  } catch (error) {
    console.error("Error getting prescription:", error);
    return { success: false, error: error.message || "Failed to get prescription" };
  }
};

// Update prescription status (admin only)
export const updatePrescriptionStatus = async (prescriptionId, status, notes = "") => {
  try {
    if (!prescriptionId) {
      return { success: false, error: "Prescription ID is required" };
    }
    
    if (!["pending", "approved", "rejected"].includes(status)) {
      return { success: false, error: "Invalid status. Must be 'pending', 'approved', or 'rejected'" };
    }
    
    const prescriptionRef = doc(db, "prescriptions", prescriptionId);
    
    await updateDoc(prescriptionRef, {
      status,
      notes: notes || "",
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating prescription status:", error);
    return { success: false, error: error.message || "Failed to update prescription status" };
  }
};

// Delete a prescription
export const deletePrescription = async (prescriptionId) => {
  try {
    if (!prescriptionId) {
      return { success: false, error: "Prescription ID is required" };
    }
    
    // Get the prescription data first to get the file reference
    const { success, prescription, error } = await getPrescriptionById(prescriptionId);
    
    if (!success) {
      return { success: false, error };
    }
    
    // Delete the file from storage if it exists
    if (prescription.fileName) {
      const storageRef = ref(storage, prescription.fileName);
      try {
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn("Error deleting file from storage:", storageError);
        // Continue with deleting the document even if file deletion fails
      }
    }
    
    // Delete the prescription document
    await deleteDoc(doc(db, "prescriptions", prescriptionId));
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return { success: false, error: error.message || "Failed to delete prescription" };
  }
};

// Order Management Functions

// Create a new order
export const createOrder = async (orderData) => {
  try {
    // Validate required fields
    if (!orderData.items || orderData.items.length === 0) {
      return { success: false, error: "Order must contain at least one item" };
    }
    
    // Backward compatibility: accept deliveryAddress and map to shippingAddress if needed
    if (!orderData.shippingAddress && orderData.deliveryAddress) {
      orderData = {
        ...orderData,
        shippingAddress: orderData.deliveryAddress,
      };
    }

    // Validate shipping address presence
    if (!orderData.shippingAddress) {
      return { success: false, error: "Shipping address is required" };
    }

    // Check if any items require prescription
    const requiresPrescription = orderData.items.some(item => item.requiresPrescription);

    // Generate OTP for delivery confirmation
    const deliveryOtp = generateOTP(6);

    // Add timestamps, OTP, and metadata
    const orderWithTimestamps = {
      ...orderData,
      requiresPrescription,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: orderData.status || "pending",
      isGuestCheckout: !orderData.userId || orderData.userId === 'guest',
      deliveryOtp
    };

    const orderRef = await addDoc(collection(db, "orders"), orderWithTimestamps);
    const orderId = orderRef.id;

    // Update the order with its ID for easier reference
    await updateDoc(orderRef, { orderId });

    // Update product stock quantities
    for (const item of orderData.items) {
      try {
        // Determine if it's a product or medicine based on requiresPrescription field
        const collectionName = item.requiresPrescription !== undefined ? "medicines" : "products";
        const itemRef = doc(db, collectionName, item.id);
        const itemDoc = await getDoc(itemRef);
        
        if (itemDoc.exists()) {
          const itemData = itemDoc.data();
          const newStockQuantity = Math.max(0, itemData.stockQuantity - item.quantity);
          
          await updateDoc(itemRef, {
            stockQuantity: newStockQuantity,
            updatedAt: new Date()
          });
        }
      } catch (err) {
        console.error(`Error updating stock for item ${item.id}:`, err);
        // Continue with other items even if one fails
      }
    }
    
    // If user is logged in, add order to user's orders collection
    if (orderData.userId && orderData.userId !== 'guest') {
      // Ensure we always store a numeric total
      const computedTotal = (Array.isArray(orderData.items)
        ? orderData.items.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity) || 0;
            return sum + price * qty;
          }, 0)
        : 0);
      const safeTotal = (typeof orderData.totalAmount === 'number')
        ? orderData.totalAmount
        : (typeof orderData.total === 'number')
          ? orderData.total
          : computedTotal;

      await addDoc(collection(db, 'users', orderData.userId, 'orders'), {
        orderId,
        createdAt: orderWithTimestamps.createdAt,
        total: safeTotal,
        status: orderWithTimestamps.status
      });
    }
    
    // Send order confirmation email if user is logged in
    try {
      if (orderData.userId && orderData.userId !== 'guest') {
        const userRef = doc(db, "users", orderData.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // Call the backend notification API
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4321'}/api/notifications/order-confirmation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              order: {
                ...orderWithTimestamps,
                orderId
              },
              user: userData
            })
          });
          
          const notificationResult = await response.json();
          console.log('Order confirmation notification result:', notificationResult);
        }
      }
    } catch (notificationError) {
      console.error('Failed to send order confirmation notification:', notificationError);
      // Continue with the order creation even if notification fails
    }
    
    return { 
      success: true, 
      orderId: orderId,
      message: "Order placed successfully" 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      return { 
        success: true, 
        order: {
          id: orderSnap.id,
          ...orderSnap.data()
        }
      };
    } else {
      return { success: false, error: "Order not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get orders for a user
export const getUserOrders = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }
    
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, orders };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get orders assigned to a delivery person
export const getDeliveryOrders = async (deliveryPersonId) => {
  try {
    // First try to get orders without sorting to check if any exist
    const simpleQuery = query(
      collection(db, "orders"),
      where("deliveryPersonId", "==", deliveryPersonId)
    );
    
    const simpleSnapshot = await getDocs(simpleQuery);
    
    // If no orders exist, return empty array immediately
    if (simpleSnapshot.empty) {
      return { success: true, orders: [] };
    }
    
    // If orders exist, try the sorted query (which requires the index)
    try {
      const ordersQuery = query(
        collection(db, "orders"),
        where("deliveryPersonId", "==", deliveryPersonId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          date: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
          customer: data.userName || 'Customer',
          address: data.address || 'No address provided',
          items: data.items?.length || 0,
          total: data.total ? `₹${data.total}` : 'N/A',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      return { success: true, orders };
    } catch (indexError) {
      // If we get an index error, throw it to be handled by the UI
      if (indexError.message.includes("index")) {
        throw indexError;
      }
      
      // For other errors, try to return the unsorted data as a fallback
      const orders = [];
      simpleSnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          date: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A',
          customer: data.userName || 'Customer',
          address: data.address || 'No address provided',
          items: data.items?.length || 0,
          total: data.total ? `₹${data.total}` : 'N/A'
        });
      });
      
      return { 
        success: true, 
        orders,
        warning: "Orders are displayed in unsorted order due to a temporary database issue."
      };
    }
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    return { success: false, error: error.message };
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status, otpCode = null) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return { success: false, error: "Order not found" };
    }
    
    const orderData = orderSnap.data();
    
    // If status is "Delivered" and OTP is required, verify OTP
    if (status === "Delivered" && otpCode) {
      // Check if OTP matches
      if (orderData.deliveryOtp !== otpCode) {
        return { success: false, error: "Invalid OTP code" };
      }
    }
    
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date()
    });
    
    // Send notification for status update
    try {
      // Get user data for the customer
      if (orderData.userId && orderData.userId !== 'guest') {
        const userRef = doc(db, "users", orderData.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // Call the backend notification API
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4321'}/api/notifications/order-status-update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              order: orderData,
              user: userData,
              status
            })
          });
          
          const notificationResult = await response.json();
          console.log('Order status update notification result:', notificationResult);
        }
      }
      
      // If there's a delivery person assigned and status changes, send them a push notification
      if (orderData.deliveryPersonId) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4321'}/api/notifications/push`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              userId: orderData.deliveryPersonId,
              notification: {
                title: 'Order Status Update',
                body: `Order #${orderData.orderId} status has been updated to ${status}`,
                data: {
                  type: 'order_status_update',
                  orderId: orderData.orderId,
                  status
                }
              }
            })
          });
          
          const pushResult = await response.json();
          console.log('Push notification result:', pushResult);
        } catch (pushError) {
          console.error('Failed to send push notification:', pushError);
        }
      }
    } catch (notificationError) {
      console.error('Failed to send order status notification:', notificationError);
      // Continue with the status update even if notification fails
    }
    
    return { 
      success: true, 
      message: "Order status updated successfully" 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Assign delivery person to an order
export const assignDeliveryPerson = async (orderId, deliveryPersonId) => {
  try {
    // Get order details
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return { success: false, error: "Order not found" };
    }
    
    // Get delivery person details
    const deliveryPersonRef = doc(db, "users", deliveryPersonId);
    const deliveryPersonSnap = await getDoc(deliveryPersonRef);
    
    if (!deliveryPersonSnap.exists()) {
      return { success: false, error: "Delivery person not found" };
    }
    
    const orderData = orderSnap.data();
    const deliveryPersonData = deliveryPersonSnap.data();
    
    // Update order with delivery person info
    await updateDoc(orderRef, {
      deliveryPersonId,
      deliveryPersonName: deliveryPersonData.displayName || deliveryPersonData.email,
      status: "Ready for Delivery",
      updatedAt: new Date()
    });
    
    // Send notification to delivery person
    try {
      // Call the backend notification API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4321'}/api/notifications/delivery-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          order: orderData,
          deliveryPerson: { ...deliveryPersonData, uid: deliveryPersonId }
        })
      });
      
      const notificationResult = await response.json();
      console.log('Delivery assignment notification result:', notificationResult);
    } catch (notificationError) {
      console.error('Failed to send delivery assignment notification:', notificationError);
      // Continue with the assignment even if notification fails
    }
    
    return { 
      success: true, 
      message: "Delivery person assigned successfully" 
    };
  } catch (error) {
    console.error("Error assigning delivery person:", error);
    return { success: false, error: error.message };
  }
};

// Get all orders (for admin)
export const getAllOrders = async (filters = {}) => {
  try {
    let ordersQuery = collection(db, "orders");
    
    // Apply filters if provided
    if (filters.status) {
      ordersQuery = query(ordersQuery, where("status", "==", filters.status));
    }
    
    // Always sort by creation date (newest first)
    ordersQuery = query(ordersQuery, orderBy("createdAt", "desc"));
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, orders };
  } catch (error) {
    console.error("Error getting all orders:", error);
    return { success: false, error: error.message };
  }
};

// Listen for real-time order updates (for admin dashboard)
export const onOrdersUpdate = (filters = {}, callback) => {
  try {
    let ordersQuery = collection(db, "orders");
    
    // Apply filters if provided
    if (filters.status && filters.status !== "all") {
      ordersQuery = query(ordersQuery, where("status", "==", filters.status));
    }
    
    // Always sort by creation date (newest first)
    ordersQuery = query(ordersQuery, orderBy("createdAt", "desc"));
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      callback({ success: true, orders });
    }, (error) => {
      console.error("Error listening to orders:", error);
      callback({ success: false, error: error.message });
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up orders listener:", error);
    callback({ success: false, error: error.message });
    return null;
  }
};

// Settings Management Functions

// Get system settings
export const getSystemSettings = async () => {
  try {
    // Check if settings document exists
    const settingsRef = doc(db, "settings", "system");
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return { 
        success: true, 
        settings: settingsSnap.data() 
      };
    } else {
      // If settings don't exist, create with defaults
      await setDoc(settingsRef, DEFAULT_SETTINGS);
      return { 
        success: true, 
        settings: DEFAULT_SETTINGS,
        isDefault: true
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update system settings
export const updateSystemSettings = async (newSettings) => {
  try {
    const settingsRef = doc(db, "settings", "system");
    
    // Add updatedAt timestamp
    const updatedSettings = {
      ...newSettings,
      updatedAt: new Date()
    };
    
    await setDoc(settingsRef, updatedSettings, { merge: true });
    
    return { 
      success: true, 
      settings: updatedSettings 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Reset system settings to defaults
export const resetSystemSettings = async () => {
  try {
    const settingsRef = doc(db, "settings", "system");
    await setDoc(settingsRef, DEFAULT_SETTINGS);
    
    return { 
      success: true, 
      settings: DEFAULT_SETTINGS 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Real-time Delivery Location Helpers =====

// Update or create the current location for a delivery person
export const updateDeliveryLocation = async (deliveryPersonId, { lat, lng, activeOrderId = null }) => {
  try {
    if (!deliveryPersonId || typeof lat !== "number" || typeof lng !== "number") {
      return { success: false, error: "Invalid delivery location payload" };
    }

    const locRef = doc(db, "deliveryLocations", deliveryPersonId);
    await setDoc(locRef, {
      lat,
      lng,
      activeOrderId: activeOrderId || null,
      updatedAt: new Date()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("updateDeliveryLocation error:", error);
    return { success: false, error: error.message };
  }
};

// Subscribe to real-time updates for a delivery person's location
export const onDeliveryLocationChange = (deliveryPersonId, callback) => {
  try {
    if (!deliveryPersonId) {
      callback({ success: false, error: "Delivery person ID is required" });
      return () => {};
    }

    const locRef = doc(db, "deliveryLocations", deliveryPersonId);
    const unsubscribe = onSnapshot(locRef, (snap) => {
      if (!snap.exists()) {
        callback({ success: true, location: null });
      } else {
        callback({ success: true, location: { id: snap.id, ...snap.data() } });
      }
    }, (error) => {
      console.error("onDeliveryLocationChange error:", error);
      callback({ success: false, error: error.message });
    });

    return unsubscribe;
  } catch (error) {
    console.error("onDeliveryLocationChange setup error:", error);
    callback({ success: false, error: error.message });
    return () => {};
  }
};

// Assign delivery with schedule and update delivery person status
export const assignDeliveryWithSchedule = async (orderId, deliveryPersonId, expectedAt = null) => {
  try {
    // Validate
    if (!orderId || !deliveryPersonId) {
      return { success: false, error: "Order ID and Delivery Person ID are required" };
    }

    // Get docs
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return { success: false, error: "Order not found" };
    const deliveryRef = doc(db, "users", deliveryPersonId);
    const deliverySnap = await getDoc(deliveryRef);
    if (!deliverySnap.exists()) return { success: false, error: "Delivery person not found" };

    const orderData = orderSnap.data();
    const deliveryData = deliverySnap.data();

    // Update order with delivery and schedule
    const updatePayload = {
      deliveryPersonId,
      deliveryPersonName: deliveryData.displayName || deliveryData.email,
      status: "Out for Delivery",
      updatedAt: new Date()
    };
    if (expectedAt instanceof Date) {
      updatePayload.expectedDeliveryAt = expectedAt;
    }
    await updateDoc(orderRef, updatePayload);

    // Mark delivery person Busy
    try {
      await updateDoc(deliveryRef, {
        status: "Busy",
        updatedAt: new Date()
      });
    } catch (e) {
      console.warn("Failed to update delivery person status:", e?.message);
    }

    // Notifications
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4321'}/api/notifications/delivery-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          order: { ...orderData, orderId: orderData.orderId || orderId, expectedDeliveryAt: expectedAt || null },
          deliveryPerson: { ...deliveryData, uid: deliveryPersonId }
        })
      });
      const notificationResult = await response.json();
      console.log('Delivery assignment (scheduled) notification result:', notificationResult);
    } catch (notificationError) {
      console.error('Failed to send delivery assignment notification:', notificationError);
    }

    // Push notification to delivery person
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4321'}/api/notifications/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: deliveryPersonId,
          notification: {
            title: 'New Delivery Assignment',
            body: `Order #${orderData.orderId || orderId} assigned to you` ,
            data: {
              type: 'delivery_assignment',
              orderId: orderData.orderId || orderId
            }
          }
        })
      });
      const pushResult = await response.json();
      console.log('Push notification result:', pushResult);
    } catch (pushError) {
      console.error('Failed to send push notification:', pushError);
    }

    return { success: true, message: 'Delivery assigned with schedule' };
  } catch (error) {
    console.error("assignDeliveryWithSchedule error:", error);
    return { success: false, error: error.message };
  }
};

export default auth;