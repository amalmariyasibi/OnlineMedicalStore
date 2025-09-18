import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// Utility function to create an admin user
export const createAdminUser = async (email, password, displayName = 'Admin User') => {
  try {
    console.log('Creating admin user with email:', email);
    
    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created successfully:', user.uid);
    
    // Set the user role as admin in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Admin role set successfully');
    
    return {
      success: true,
      user: user,
      message: 'Admin user created successfully'
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Utility function to test admin login
export const testAdminLogin = async (email, password) => {
  try {
    console.log('Testing admin login with email:', email);
    
    // Sign in the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Login successful:', user.uid);
    
    // Get user data from Firestore to verify role
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('User role:', userData.role);
      
      return {
        success: true,
        user: {
          ...user,
          role: userData.role
        },
        message: 'Admin login successful'
      };
    } else {
      return {
        success: false,
        error: 'User data not found in Firestore'
      };
    }
  } catch (error) {
    console.error('Error testing admin login:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to check if current user is admin
export const isCurrentUserAdmin = () => {
  const user = auth.currentUser;
  if (!user) return false;
  
  // This would need to be called after the user data is loaded from Firestore
  // The actual role checking is done in the AuthContext
  return user.role === 'admin';
};
