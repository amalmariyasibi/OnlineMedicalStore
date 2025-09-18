import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

// Upload a prescription file to Firebase Storage
export const uploadPrescriptionFile = async (file, userId, onProgress) => {
  try {
    if (!file || !userId) {
      throw new Error('File and user ID are required');
    }

    // Create a storage reference
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `prescriptions/${fileName}`);

    // Upload the file with progress monitoring
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate and report progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Handle errors
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              fileName,
              fileUrl: downloadURL,
              contentType: file.type,
              size: file.size
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in uploadPrescriptionFile:', error);
    throw error;
  }
};

// Create a new prescription record in Firestore
export const createPrescription = async (prescriptionData) => {
  try {
    const { userId, fileInfo, notes, status = 'pending' } = prescriptionData;

    if (!userId || !fileInfo) {
      throw new Error('User ID and file information are required');
    }

    const prescriptionRecord = {
      userId,
      fileName: fileInfo.fileName,
      fileUrl: fileInfo.fileUrl,
      contentType: fileInfo.contentType,
      size: fileInfo.size,
      notes: notes || '',
      status, // pending, approved, rejected
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'prescriptions'), prescriptionRecord);
    return {
      id: docRef.id,
      ...prescriptionRecord
    };
  } catch (error) {
    console.error('Error in createPrescription:', error);
    throw error;
  }
};

// Get all prescriptions for a user
export const getUserPrescriptions = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const prescriptionsQuery = query(
      collection(db, 'prescriptions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(prescriptionsQuery);
    const prescriptions = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to JavaScript Date
      const createdAt = data.createdAt?.toDate() || null;
      const updatedAt = data.updatedAt?.toDate() || null;

      prescriptions.push({
        id: doc.id,
        ...data,
        createdAt,
        updatedAt
      });
    });

    return prescriptions;
  } catch (error) {
    console.error('Error in getUserPrescriptions:', error);
    throw error;
  }
};

// Get a single prescription by ID
export const getPrescriptionById = async (prescriptionId) => {
  try {
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }

    const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
    const prescriptionSnap = await getDoc(prescriptionRef);

    if (!prescriptionSnap.exists()) {
      throw new Error('Prescription not found');
    }

    const data = prescriptionSnap.data();
    // Convert Firestore Timestamp to JavaScript Date
    const createdAt = data.createdAt?.toDate() || null;
    const updatedAt = data.updatedAt?.toDate() || null;

    return {
      id: prescriptionSnap.id,
      ...data,
      createdAt,
      updatedAt
    };
  } catch (error) {
    console.error('Error in getPrescriptionById:', error);
    throw error;
  }
};

// Update a prescription's status or notes
export const updatePrescription = async (prescriptionId, updateData) => {
  try {
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }

    const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
    const prescriptionSnap = await getDoc(prescriptionRef);

    if (!prescriptionSnap.exists()) {
      throw new Error('Prescription not found');
    }

    const updates = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    await updateDoc(prescriptionRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error in updatePrescription:', error);
    throw error;
  }
};

// Delete a prescription and its file
export const deletePrescription = async (prescriptionId) => {
  try {
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }

    // Get the prescription data first to get the file name
    const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
    const prescriptionSnap = await getDoc(prescriptionRef);

    if (!prescriptionSnap.exists()) {
      throw new Error('Prescription not found');
    }

    const prescriptionData = prescriptionSnap.data();

    // Delete the file from storage if it exists
    if (prescriptionData.fileName) {
      const storageRef = ref(storage, `prescriptions/${prescriptionData.fileName}`);
      try {
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('File may not exist in storage:', storageError);
        // Continue with deletion even if file doesn't exist in storage
      }
    }

    // Delete the document from Firestore
    await deleteDoc(prescriptionRef);
    return { success: true };
  } catch (error) {
    console.error('Error in deletePrescription:', error);
    throw error;
  }
};

// Get all prescriptions (admin only)
export const getAllPrescriptions = async (filters = {}) => {
  try {
    let prescriptionsQuery = collection(db, 'prescriptions');
    
    // Apply status filter if provided
    if (filters.status) {
      prescriptionsQuery = query(prescriptionsQuery, where('status', '==', filters.status));
    }
    
    // Apply date range filter if provided
    if (filters.startDate && filters.endDate) {
      const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
      const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
      prescriptionsQuery = query(
        prescriptionsQuery, 
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );
    }
    
    // Always order by creation date
    prescriptionsQuery = query(prescriptionsQuery, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(prescriptionsQuery);
    const prescriptions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to JavaScript Date
      const createdAt = data.createdAt?.toDate() || null;
      const updatedAt = data.updatedAt?.toDate() || null;
      
      prescriptions.push({
        id: doc.id,
        ...data,
        createdAt,
        updatedAt
      });
    });
    
    return prescriptions;
  } catch (error) {
    console.error('Error in getAllPrescriptions:', error);
    throw error;
  }
};