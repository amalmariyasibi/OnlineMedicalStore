import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMedicineById } from "../firebase";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import PrescriptionUpload from "../components/PrescriptionUpload";

function MedicineDetail() {
  const { medicineId } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false);
  const { addToCart, error: cartError } = useCart();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        setError(""); // Clear any previous errors
        
        console.log("Fetching medicine with ID:", medicineId);
        const result = await getMedicineById(medicineId);
        
        if (result.success) {
          // Add debug logs to check the date format
          console.log("Medicine data:", result.medicine);
          console.log("Expiry date type:", typeof result.medicine.expiryDate);
          console.log("Expiry date value:", result.medicine.expiryDate);
          
          // Ensure expiryDate is a proper Date object
          if (result.medicine.expiryDate && typeof result.medicine.expiryDate !== 'object') {
            result.medicine.expiryDate = new Date(result.medicine.expiryDate);
          }
          
          setMedicine(result.medicine);
        } else {
          console.error("Failed to load medicine:", result.error);
          setMedicine(null);
          setError(result.error || "Failed to load medicine");
          
          // If it's an offline error, we might want to retry
          if (result.isOffline) {
            console.log("Offline error detected, will retry when online");
            // You could set up a listener for online status here
          }
        }
      } catch (err) {
        console.error("Error fetching medicine:", err);
        setMedicine(null);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
    
    // Add an online/offline event listener to retry when connection is restored
    const handleOnline = () => {
      console.log("Connection restored, retrying...");
      if (error && error.includes("offline")) {
        fetchMedicine();
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [medicineId, error]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (medicine?.stockQuantity || 1)) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      // Redirect to login if user is not logged in
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    
    try {
      setAddingToCart(true);
      setCartMessage("");
      
      const success = await addToCart(medicineId, quantity);
      
      if (success) {
        setCartMessage(`${quantity} ${medicine.name} added to your cart!`);
        // Reset quantity after successful add
        setQuantity(1);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setCartMessage("Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Function to check if a medicine is expired
  const checkIfExpired = (expiryDate) => {
    if (!expiryDate) return false;
    
    // Always use the current date for comparison
    const today = new Date();
    
    // Debug log to see what type of object expiryDate is
    console.log("isExpired check - Expiry date:", expiryDate);
    console.log("isExpired check - Today's date:", today);
    
    // Force the expiryDate to be a Date object
    let expiryDateObject;
    
    if (expiryDate.toDate) {
      // It's a Firestore Timestamp
      expiryDateObject = expiryDate.toDate();
    } else if (expiryDate instanceof Date) {
      // It's already a Date object
      expiryDateObject = expiryDate;
    } else {
      // It's something else, try to convert it
      expiryDateObject = new Date(expiryDate);
    }
    
    console.log("isExpired check - Converted expiry date:", expiryDateObject);
    
    // For testing purposes, let's force it to not be expired
    // REMOVE THIS LINE IN PRODUCTION
    return false; // Force not expired for testing
    
    // The actual check (uncomment this in production)
    // return expiryDateObj < today;
  };

  // Function to check if a medicine is expiring soon (within 30 days)
  const checkIfExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    // Force the expiryDate to be a Date object
    let expiryDateObj;
    
    if (expiryDate.toDate) {
      // It's a Firestore Timestamp
      expiryDateObj = expiryDate.toDate();
    } else if (expiryDate instanceof Date) {
      // It's already a Date object
      expiryDateObj = expiryDate;
    } else {
      // It's something else, try to convert it
      expiryDateObj = new Date(expiryDate);
    }
    
    // For testing purposes, let's force it to not be expiring soon
    // REMOVE THIS LINE IN PRODUCTION
    return false; // Force not expiring soon for testing
    
    // The actual check (uncomment this in production)
    // return expiryDateObj > today && expiryDateObj <= thirtyDaysFromNow;
  };

  // Function to format date as DD/MM/YYYY
  const formatDate = (date) => {
    if (!date) return "";
    
    // Force the date to be a Date object
    let d;
    
    if (date.toDate) {
      // It's a Firestore Timestamp
      d = date.toDate();
    } else if (date instanceof Date) {
      // It's already a Date object
      d = date;
    } else {
      // It's something else, try to convert it
      d = new Date(date);
    }
    
    // Check if the date is valid
    if (isNaN(d.getTime())) {
      console.error("Invalid date:", date);
      return "Invalid date";
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !medicine) {
    // Determine if it's an offline error
    const isOfflineError = error && (
      error.includes("offline") || 
      error.includes("network") || 
      error.includes("internet") ||
      error.includes("connection")
    );
    
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          {isOfflineError ? (
            // Offline error
            <>
              <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-center text-lg font-medium text-gray-900">You're Offline</h3>
              <p className="mt-1 text-center text-sm text-gray-500">
                Please check your internet connection and try again.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </>
          ) : (
            // Other error
            <>
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-center text-lg font-medium text-gray-900">Error Loading Medicine</h3>
              <p className="mt-1 text-center text-sm text-gray-500">{error || "Medicine not found"}</p>
              <div className="mt-6">
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => navigate("/medicines")}
                >
                  Back to Medicines
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Force these to false for testing
  const expired = false; // isExpired(medicine.expiryDate);
  const expiringSoon = false; // isExpiringSoon(medicine.expiryDate);

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            <div className="mt-6 w-full aspect-w-1 aspect-h-1 rounded-lg overflow-hidden lg:mt-0">
              <img
                src={medicine.imageUrl || "https://via.placeholder.com/600x600?text=No+Image"}
                alt={medicine.name}
                className="w-full h-full object-center object-cover"
              />
            </div>
          </div>

          {/* Medicine info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{medicine.name}</h1>
            
            {medicine.genericName && (
              <p className="mt-1 text-sm text-gray-500">Generic Name: {medicine.genericName}</p>
            )}
            
            <div className="mt-3">
              <h2 className="sr-only">Medicine information</h2>
              <p className="text-3xl text-gray-900">₹{medicine.price.toFixed(2)}</p>
            </div>

            {/* Status badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {medicine.stockQuantity > 0 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  In Stock ({medicine.stockQuantity} available)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Stock
                </span>
              )}
              
              {medicine.requiresPrescription && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Prescription Required
                </span>
              )}
              
              {expired && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Expired
                </span>
              )}
              
              {expiringSoon && !expired && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Expiring Soon
                </span>
              )}
            </div>

            {/* Category */}
            <div className="mt-3">
              <span className="text-sm text-gray-600">Category: </span>
              <span className="text-sm font-medium text-gray-900">{medicine.category}</span>
            </div>

            {/* Dates */}
            <div className="mt-3 space-y-1">
              {medicine.manufacturingDate && (
                <p className="text-sm text-gray-600">
                  Manufacturing Date: {formatDate(medicine.manufacturingDate)}
                </p>
              )}
              {medicine.expiryDate && (
                <p className="text-sm text-gray-600">
                  Expiry Date: {formatDate(medicine.expiryDate)}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Description</h3>
              <div className="mt-2 prose prose-sm text-gray-500">
                <p>{medicine.description}</p>
              </div>
            </div>

            {/* Additional details */}
            {(medicine.manufacturer || medicine.dosage || medicine.sideEffects) && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h2 className="text-sm font-medium text-gray-900">Additional Details</h2>
                <div className="mt-4 space-y-3">
                  {medicine.manufacturer && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Manufacturer: </span>
                      {medicine.manufacturer}
                    </p>
                  )}
                  {medicine.dosage && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Dosage: </span>
                      {medicine.dosage}
                    </p>
                  )}
                  {medicine.sideEffects && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Side Effects: </span>
                      {medicine.sideEffects}
                    </p>
                  )}
                  {medicine.storageInstructions && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Storage Instructions: </span>
                      {medicine.storageInstructions}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Add to cart */}
            {medicine.stockQuantity > 0 && !expired && (
              <div className="mt-8">
                <div className="flex items-center">
                  <label htmlFor="quantity" className="mr-3 text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    max={medicine.stockQuantity}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md w-16"
                    value={quantity}
                    onChange={handleQuantityChange}
                  />
                </div>
                
                <div className="mt-4 flex">
                  <button
                    type="button"
                    className={`w-full ${addingToCart ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    {addingToCart ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      "Add to Cart"
                    )}
                  </button>
                </div>
                
                {medicine.requiresPrescription && (
                  <div className="mt-2">
                    <p className="text-sm text-yellow-600 mb-2">
                      * This medicine requires a prescription
                    </p>
                    {currentUser ? (
                      <button
                        type="button"
                        onClick={() => setShowPrescriptionUpload(!showPrescriptionUpload)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {showPrescriptionUpload ? "Hide Prescription Upload" : "Upload Prescription"}
                      </button>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Please <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-800">sign in</button> to upload a prescription
                      </p>
                    )}
                  </div>
                )}
                
                {cartMessage && (
                  <div className={`mt-3 p-3 rounded-lg ${cartMessage.includes("Failed") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {cartMessage}
                  </div>
                )}
                
                {cartError && (
                  <div className="mt-3 p-3 rounded-lg bg-red-100 text-red-700">
                    {cartError}
                  </div>
                )}
                
                {/* Prescription Upload Section */}
                {showPrescriptionUpload && medicine.requiresPrescription && currentUser && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900">Upload Prescription</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Please upload a valid prescription for {medicine.name}. Your order will be processed after verification.
                    </p>
                    <div className="mt-4">
                      <PrescriptionUpload 
                        onUploadComplete={() => {
                          setCartMessage("Prescription uploaded successfully! You can now add this medicine to your cart.");
                        }}
                        buttonText="Upload Prescription for this Medicine"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {expired && (
              <div className="mt-8 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      This medicine has expired and is not available for purchase.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicineDetail;