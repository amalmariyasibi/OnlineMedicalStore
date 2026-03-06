// SIMPLE FIX - Copy this entire function and replace getAllPrescriptions in prescriptionService.js

export const getAllPrescriptions = async (filters = {}) => {
  try {
    console.log('🔍 Fetching all prescriptions...');
    
    // Simple query without orderBy to avoid index issues
    const prescriptionsRef = collection(db, 'prescriptions');
    const querySnapshot = await getDocs(prescriptionsRef);
    
    console.log('📊 Total documents found:', querySnapshot.size);
    
    const prescriptions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert timestamps
      const createdAt = data.createdAt?.toDate() || null;
      const updatedAt = data.updatedAt?.toDate() || null;
      
      prescriptions.push({
        id: doc.id,
        ...data,
        createdAt,
        updatedAt
      });
    });
    
    // Apply filters in memory
    let filtered = prescriptions;
    
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt - a.createdAt;
    });
    
    console.log('✅ Returning', filtered.length, 'prescriptions');
    return filtered;
    
  } catch (error) {
    console.error('❌ Error fetching prescriptions:', error);
    throw error;
  }
};
