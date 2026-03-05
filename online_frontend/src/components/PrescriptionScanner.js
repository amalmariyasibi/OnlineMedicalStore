import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContextSimple';
import Fuse from 'fuse.js';

const PrescriptionScanner = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawOcrText, setRawOcrText] = useState('');
  const [matchedMedicines, setMatchedMedicines] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setSuccess('');
    setRawOcrText('');
    setMatchedMedicines([]);

    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG)');
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setRawOcrText('');
    setMatchedMedicines([]);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleScanPrescription = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to scan prescriptions');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', currentUser.uid);

      const response = await fetch('/api/prescriptions/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to process prescription');
      }

      if (result.success) {
        setRawOcrText(result.data.rawText);
        setMatchedMedicines(result.data.matchedMedicines || []);
        
        if (result.data.matchedMedicines.length === 0) {
          setError('No medicines detected in the prescription. Please try a clearer image.');
        } else {
          setSuccess(`Successfully detected ${result.data.matchedMedicines.length} medicine(s)`);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan prescription');
    } finally {
      setIsProcessing(false);
    }
  };

  const getMatchBadge = (confidence) => {
    if (confidence >= 0.7) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          High Match
        </span>
      );
    } else if (confidence >= 0.4) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Medium Match
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          No Match
        </span>
      );
    }
  };

  const handleAddToCart = async (medicine) => {
    if (!medicine.matched) {
      setError('Cannot add unmatched medicine to cart');
      return;
    }

    try {
      await addToCart(medicine.matched, 1);
      
      // Save correction for learning
      await fetch('/api/prescriptions/corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          extractedMedicineName: medicine.extracted.name,
          correctedMedicineId: medicine.matched.id,
          correctedMedicineName: medicine.matched.name,
          confidence: medicine.confidence
        }),
      });

      // Update UI
      setMatchedMedicines(prev =>
        prev.map(m =>
          m.extracted.name === medicine.extracted.name
            ? { ...m, addedToCart: true }
            : m
        )
      );
      
      // Show success message
      setSuccess(`${medicine.matched.name} added to cart!`);
    } catch (err) {
      console.error('Add to cart error:', err);
      setError('Failed to add medicine to cart');
    }
  };
  
  const handleViewCart = () => {
    navigate('/cart');
  };
  
  const handleAddAllToCart = async () => {
    const matchedItems = matchedMedicines.filter(m => m.matched && m.matched.stockQuantity > 0 && !m.addedToCart);
    
    if (matchedItems.length === 0) {
      setError('No medicines available to add');
      return;
    }
    
    try {
      for (const medicine of matchedItems) {
        await addToCart(medicine.matched, 1);
        
        // Save correction
        await fetch('/api/prescriptions/corrections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.uid,
            extractedMedicineName: medicine.extracted.name,
            correctedMedicineId: medicine.matched.id,
            correctedMedicineName: medicine.matched.name,
            confidence: medicine.confidence
          }),
        });
      }
      
      // Update all as added
      setMatchedMedicines(prev =>
        prev.map(m => m.matched && m.matched.stockQuantity > 0 ? { ...m, addedToCart: true } : m)
      );
      
      setSuccess(`Added ${matchedItems.length} medicine(s) to cart!`);
      
      // Navigate to cart after 1 second
      setTimeout(() => {
        navigate('/cart');
      }, 1000);
    } catch (err) {
      console.error('Add all to cart error:', err);
      setError('Failed to add medicines to cart');
    }
  };

  const handleEditMedicine = (medicine, index) => {
    // This would open a modal to manually select the correct medicine
    // For now, we'll just log it
    console.log('Edit medicine:', medicine);
    // TODO: Implement medicine selection modal
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Upload & OCR */}
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Upload Prescription
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* File Upload Area */}
            {!preview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="prescription-upload"
                />
                <label
                  htmlFor="prescription-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    className="w-16 h-16 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 5MB
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="Prescription preview"
                    className="w-full h-64 object-contain bg-gray-50"
                  />
                  <button
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* File Info */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">{file.name}</p>
                  <p className="text-xs text-blue-700">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>

                {/* Scan Button */}
                <button
                  onClick={handleScanPrescription}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                    isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Scan Prescription
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Raw OCR Output */}
          {rawOcrText && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
                Raw OCR Output
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {rawOcrText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Matched Medicines */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Detected Medicines
            </h2>
            {matchedMedicines.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={handleAddAllToCart}
                  disabled={matchedMedicines.filter(m => m.matched && m.matched.stockQuantity > 0 && !m.addedToCart).length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add All to Cart
                </button>
                <button
                  onClick={handleViewCart}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors"
                >
                  View Cart
                </button>
              </div>
            )}
          </div>

          {matchedMedicines.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-gray-500">
                Upload and scan a prescription to see detected medicines
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {matchedMedicines.map((medicine, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Medicine Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {medicine.matched
                            ? medicine.matched.name
                            : medicine.extracted.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Raw: "{medicine.extracted.name}"
                        </p>
                      </div>
                    </div>
                    {getMatchBadge(medicine.confidence)}
                  </div>

                  {/* Medicine Details */}
                  {medicine.matched ? (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 w-20">Price:</span>
                        <span className="font-semibold text-green-600">
                          ₹{medicine.matched.price}
                        </span>
                      </div>
                      {medicine.extracted.strength && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-20">Strength:</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                            </svg>
                            {medicine.extracted.strength}
                          </span>
                        </div>
                      )}
                      {medicine.extracted.dosage && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-20">Dosage:</span>
                          <span className="text-gray-800">{medicine.extracted.dosage}</span>
                        </div>
                      )}
                      {medicine.extracted.duration && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-20">Duration:</span>
                          <span className="text-gray-800">{medicine.extracted.duration}</span>
                        </div>
                      )}
                      {medicine.matched.stockQuantity !== undefined && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 w-20">Stock:</span>
                          <span
                            className={`font-medium ${
                              medicine.matched.stockQuantity > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {medicine.matched.stockQuantity > 0
                              ? 'In Stock'
                              : 'Out of Stock'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                      <p className="text-xs text-yellow-800">
                        No exact match found. Please select manually or try a clearer image.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {medicine.matched && medicine.matched.stockQuantity > 0 && (
                      <button
                        onClick={() => handleAddToCart(medicine)}
                        disabled={medicine.addedToCart}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          medicine.addedToCart
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                        }`}
                      >
                        {medicine.addedToCart ? (
                          <>
                            <svg
                              className="w-4 h-4 inline mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Added
                          </>
                        ) : (
                          '+ Add to Cart'
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleEditMedicine(medicine, index)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScanner;
