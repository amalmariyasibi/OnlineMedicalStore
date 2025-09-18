import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Utility to set any user as admin
export const setUserAsAdmin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      role: 'admin',
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true, message: 'User role updated to admin' };
  } catch (error) {
    console.error('Error setting user as admin:', error);
    return { success: false, error: error.message };
  }
};

// Utility to get current user's role
export const getCurrentUserRole = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, role: userSnap.data().role };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user role:', error);
    return { success: false, error: error.message };
  }
};

// Utility to create admin user if not exists
export const ensureAdminUser = async (email, password, displayName = 'Admin') => {
  try {
    // This would need to be called from a component that has access to Firebase Auth
    // For now, this is just a placeholder for the logic
    console.log('Ensure admin user function called');
    return { success: true, message: 'Admin user ensured' };
  } catch (error) {
    console.error('Error ensuring admin user:', error);
    return { success: false, error: error.message };
  }
};
