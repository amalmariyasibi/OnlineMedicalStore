import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPrescriptions, updatePrescription } from '../../services/prescriptionService';
import { useAuth } from '../../contexts/AuthContext';

const AdminPrescriptions = () => {
  const { currentUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!currentUser || currentUser.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Apply filters
        const filters = {};
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        
        const allPrescriptions = await getAllPrescriptions(filters);
        setPrescriptions(allPrescriptions);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [currentUser, statusFilter, refreshTrigger]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowModal(true);
  };

  const handleUpdateStatus = async (prescriptionId, newStatus) => {
    try {
      setError('');
      await updatePrescription(prescriptionId, { status: newStatus });
      
      // Update the local state
      setPrescriptions(prevPrescriptions => 
        prevPrescriptions.map(p => 
          p.id === prescriptionId ? { ...p, status: newStatus } : p
        )
      );
      
      // If we're updating the currently selected prescription, update that too
      if (selectedPrescription && selectedPrescription.id === prescriptionId) {
        setSelectedPrescription(prev => ({ ...prev, status: newStatus }));
      }
      
      // Refresh the prescriptions list
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error updating prescription status:', err);
      setError('Failed to update prescription status. Please try again later.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPrescription(null);
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Helper function to get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Prescriptions</h1>
        
        <div className="flex items-center">
          <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
            Filter by Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter !== 'all' 
                  ? `No prescriptions with status "${statusFilter}" found.` 
                  : "There are no prescriptions in the system yet."}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                  <li key={prescription.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="ml-2 text-sm font-medium text-gray-900 truncate">
                            {prescription.fileName.split('_').pop()}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(prescription.status)}`}>
                            {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            User ID: {prescription.userId.substring(0, 8)}...
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {formatFileSize(prescription.size)}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <p>
                            {prescription.createdAt ? prescription.createdAt.toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => handleViewPrescription(prescription)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View
                        </button>
                        
                        {prescription.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(prescription.id, 'approved')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(prescription.id, 'rejected')}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

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
                  <h4 className="text-sm font-medium text-gray-900">Notes from User:</h4>
                  <p className="mt-1 text-sm text-gray-600">{selectedPrescription.notes}</p>
                </div>
              )}
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">User ID</p>
                  <p className="font-medium">{selectedPrescription.userId}</p>
                </div>
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
                      selectedPrescription.createdAt.toLocaleDateString() : 
                      'Unknown date'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">File Size</p>
                  <p className="font-medium">{formatFileSize(selectedPrescription.size)}</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              {selectedPrescription.status === 'pending' && (
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedPrescription.id, 'approved');
                      closeModal();
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Approve Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedPrescription.id, 'rejected');
                      closeModal();
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Reject Prescription
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 ml-auto"
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

export default AdminPrescriptions;