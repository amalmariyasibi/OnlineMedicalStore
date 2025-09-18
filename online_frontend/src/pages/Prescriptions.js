import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PrescriptionUpload from '../components/PrescriptionUpload';
import PrescriptionList from '../components/PrescriptionList';
import { getUserPrescriptions, deletePrescription } from '../services/prescriptionService';

const Prescriptions = () => {
  const { currentUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const userPrescriptions = await getUserPrescriptions(currentUser.uid);
        setPrescriptions(userPrescriptions);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [currentUser, refreshTrigger]);

  const handleUploadComplete = (prescription) => {
    // Refresh the prescriptions list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowModal(true);
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        setError('');
        await deletePrescription(prescriptionId);
        // Refresh the prescriptions list
        setRefreshTrigger(prev => prev + 1);
      } catch (err) {
        console.error('Error deleting prescription:', err);
        setError('Failed to delete prescription. Please try again later.');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPrescription(null);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to view and manage your prescriptions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Prescriptions</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PrescriptionUpload onUploadComplete={handleUploadComplete} />
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-4">Your Prescriptions</h2>
              <PrescriptionList 
                prescriptions={prescriptions} 
                onDelete={handleDeletePrescription}
                onView={handleViewPrescription}
              />
            </>
          )}
        </div>
      </div>

      {/* Prescription View Modal */}
      {showModal && selectedPrescription && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Prescription Details</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
              {selectedPrescription.contentType.includes('image') ? (
                <img 
                  src={selectedPrescription.fileUrl} 
                  alt="Prescription" 
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : selectedPrescription.contentType.includes('pdf') ? (
                <div className="aspect-w-16 aspect-h-9">
                  <iframe 
                    src={`${selectedPrescription.fileUrl}#toolbar=0`} 
                    title="Prescription PDF"
                    className="w-full h-[70vh]"
                  ></iframe>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>This file type cannot be previewed.</p>
                  <a 
                    href={selectedPrescription.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Download File
                  </a>
                </div>
              )}
              
              {selectedPrescription.notes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900">Notes:</h4>
                  <p className="mt-1 text-sm text-gray-600">{selectedPrescription.notes}</p>
                </div>
              )}
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${selectedPrescription.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        selectedPrescription.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}
                    >
                      {selectedPrescription.status.charAt(0).toUpperCase() + selectedPrescription.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Uploaded On</p>
                  <p className="font-medium">
                    {selectedPrescription.createdAt ? 
                      new Date(selectedPrescription.createdAt).toLocaleDateString() : 
                      'Unknown date'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;