import React, { useState, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { uploadPrescriptionFile, createPrescription } from '../services/prescriptionService';

const PrescriptionUpload = ({ onUploadComplete, buttonText = "Upload Prescription" }) => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const uploadTaskRef = useRef(null);
  const fileInputRef = useRef(null);

  const allowedFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setSuccess('');

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!allowedFileTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, or PDF file.');
      setFile(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > maxFileSize) {
      setError(`File is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB.`);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to upload prescriptions');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      setSuccess('');
      setUploadProgress(0);

      // Upload file to Firebase Storage
      const fileInfo = await uploadPrescriptionFile(
        file,
        currentUser.uid,
        (progress) => setUploadProgress(progress),
        (task) => {
          uploadTaskRef.current = task;
        }
      );

      console.log('File uploaded to backend. Info:', fileInfo);

      // Create prescription record in Firestore
      const prescriptionData = {
        userId: currentUser.uid,
        fileInfo,
        notes
      };

      console.log('Creating prescription in Firestore with data:', prescriptionData);

      const prescription = await createPrescription(prescriptionData);

      console.log('Prescription created successfully:', prescription);

      setSuccess('Prescription uploaded successfully!');
      setFile(null);
      setNotes('');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(prescription);
      }
    } catch (err) {
      console.error('Upload flow error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
      uploadTaskRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (uploadTaskRef.current) {
      try {
        uploadTaskRef.current.cancel();
      } catch (e) {
        console.error('Error cancelling upload:', e);
      }
    }
    uploadTaskRef.current = null;
    setIsUploading(false);
    setUploadProgress(0);
    setError('Upload cancelled.');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Upload Prescription</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700">
          <p>{success}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prescription File
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.pdf"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          disabled={isUploading}
        />
        <p className="mt-1 text-xs text-gray-500">
          Accepted formats: JPEG, PNG, PDF. Maximum size: 5MB.
        </p>
      </div>

      {file && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium">Selected file:</p>
          <p className="text-sm text-gray-600">{file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={handleNotesChange}
          rows="3"
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Add any additional information about your prescription..."
          disabled={isUploading}
        ></textarea>
      </div>

      {isUploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500 text-right">
            {uploadProgress.toFixed(0)}% uploaded
          </p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !file}
          className={`flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isUploading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : buttonText}
        </button>

        {isUploading && (
          <button
            type="button"
            onClick={handleCancelUpload}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>

    </div>
  );
};

export default PrescriptionUpload;