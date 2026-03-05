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
import { db } from '../firebaseConfig';

// Upload a prescription file via backend (Cloudinary) instead of Firebase Storage
// onProgress and onTaskCreated are kept in the signature for backward compatibility,
// but are currently not used with the simple fetch-based implementation.
export const uploadPrescriptionFile = async (file, userId, onProgress, onTaskCreated) => {
  try {
    if (!file || !userId) {
      throw new Error('File and user ID are required');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch('/api/prescriptions/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();

    return {
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      contentType: data.contentType || file.type,
      size: data.size || file.size,
      resourceType: data.resourceType,
      format: data.format,
    };
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
      resourceType: fileInfo.resourceType || 'image', // explicit default
      format: fileInfo.format || null,
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

    // Get the prescription data first
    const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
    const prescriptionSnap = await getDoc(prescriptionRef);

    if (!prescriptionSnap.exists()) {
      throw new Error('Prescription not found');
    }

    // Note: Files are stored in Cloudinary, not Firebase Storage
    // Cloudinary cleanup would need to be handled separately if needed
    // For now, we only delete the Firestore record

    // Delete the document from Firestore
    await deleteDoc(prescriptionRef);
    return { success: true };
  } catch (error) {
    console.error('Error in deletePrescription:', error);
    throw error;
  }
};

// Get a signed URL for viewing a Cloudinary file
export const getSignedUrl = async (publicId, resourceType, format) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    // Use query parameter instead of path parameter to avoid URL encoding issues
    let url = `/api/prescriptions/signed-url?publicId=${encodeURIComponent(publicId)}`;
    if (resourceType) {
      url += `&resourceType=${resourceType}`;
    }
    if (format) {
      url += `&format=${format}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to get signed URL');
    }

    const data = await response.json();
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
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