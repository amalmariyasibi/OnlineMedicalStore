import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createOrder, getUserOrders } from "../firebase";
import { analyzeDrugSafety } from "../services/drugInteractionService";

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.Razorpay) {
      console.log('Razorpay script already loaded');
      resolve(true);
      return;
    }
    
    console.log('Loading Razorpay script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };

    script.onerror = (error) => {
      console.error('Error loading Razorpay script:', error);
      reject(new Error('Failed to load Razorpay script'));
    };
    
    document.body.appendChild(script);
  });
};

function Checkout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = location.state?.buyNowItem;
  
  const [cartItems, setCartItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    mobile: '',
    pincode: '',
    locality: '',
    address: '',
    city: '',
    state: '',
    landmark: '',
    alternatePhone: ''
  });
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [addressErrors, setAddressErrors] = useState({});

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported in this browser.');
      return;
    }

    setLocationLoading(true);
    setLocationStatus('Detecting your current location...');

    // Failsafe timeout so UI doesn't stay stuck forever
    const timeoutId = setTimeout(() => {
      if (locationLoading) {
        setLocationLoading(false);
        setLocationStatus('Unable to get location. Please ensure browser permission is allowed and try again.');
      }
    }, 20000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCustomerLocation({ lat: latitude, lng: longitude, accuracy, timestamp: new Date().toISOString() });
        setLocationStatus('Location captured successfully.');
        clearTimeout(timeoutId);
        setLocationLoading(false);
      },
      (err) => {
        console.error('Geolocation error during checkout:', err);
        setLocationStatus(err.message || 'Unable to get your current location.');
        clearTimeout(timeoutId);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    );
  };

  const validateDeliveryAddress = (addr) => {
    const errors = {};
    const name = (addr.fullName || '').trim();
    const mobile = (addr.mobile || '').trim();
    const pincode = (addr.pincode || '').trim();
    const locality = (addr.locality || '').trim();
    const address = (addr.address || '').trim();
    const city = (addr.city || '').trim();
    const state = (addr.state || '').trim();

    if (name.length < 2) errors.fullName = 'Please enter your full name';
    if (!/^[0-9]{10}$/.test(mobile)) errors.mobile = 'Enter a valid 10-digit mobile number';
    if (!/^[1-9][0-9]{5}$/.test(pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
    if (locality.length === 0) errors.locality = 'Locality is required';
    if (address.length < 10) errors.address = 'Enter a complete address (min 10 chars)';
    if (city.length === 0) errors.city = 'City is required';
    if (state.length === 0) errors.state = 'State is required';

    return { valid: Object.keys(errors).length === 0, errors };
  };

  useEffect(() => {
    if (buyNowItem) {
      setCartItems([buyNowItem]);
    } else {
      // Load cart items from localStorage
      const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
      const savedCart = localStorage.getItem(cartKey);
      
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
        } catch (error) {
          console.error('Error parsing cart:', error);
          setCartItems([]);
        }
      }
    }
  }, [currentUser, buyNowItem]);

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const safetyAnalysis = analyzeDrugSafety({ items: cartItems });

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      alert('Please login to place order');
      navigate('/login');
      return;
    }

    if (safetyAnalysis.hasSevereIssue) {
      alert('Your order contains medicines with severe interaction or allergy risks. Please review your cart with your doctor or remove the highlighted medicines.');
      return;
    }

    if (currentStep < 4) {
      if (currentStep === 2) {
        const { valid, errors } = validateDeliveryAddress(deliveryAddress);
        if (!valid) {
          setAddressErrors(errors);
          return;
        }
        setAddressErrors({});
      }
      setCurrentStep(currentStep + 1);
      return;
    }

    // Validate delivery address
    {
      const { valid, errors } = validateDeliveryAddress(deliveryAddress);
      if (!valid) {
        setAddressErrors(errors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setAddressErrors({});
    }

    setLoading(true);
    
    try {
      if (paymentMethod === 'online') {
        await handleOnlinePayment();
      } else {
        await handleCODOrder();
      }
    } catch (error) {
      console.error('Order placement error:', error);
      alert('An error occurred while placing the order');
      setLoading(false);
    }
  };

  const handleCODOrder = async () => {
    try {
      const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cartItems,
        totalAmount: cartTotal,
        deliveryAddress,
        customerLocation: customerLocation || null,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'pending'
      };

      const result = await createOrder(orderData);
      
      if (result.success) {
        // Persist this address locally for faster future checkouts
        try {
          if (currentUser?.uid) {
            localStorage.setItem(`lastAddress_${currentUser.uid}`, JSON.stringify(deliveryAddress));
          }
        } catch (e) {
          console.warn('Unable to save lastAddress to localStorage:', e);
        }
        clearCartAndNavigate(result.orderId);
      } else {
        alert('Failed to place order: ' + result.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('COD order error:', error);
      alert('Failed to place COD order');
      setLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    try {
      console.log('Initializing online payment...');
      
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        console.error('Failed to load Razorpay script');
        alert('Failed to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      // Optional: connectivity check to surface clearer errors
      try {
        console.log('Checking backend connectivity...');
        // When REACT_APP_API_URL is not set, we're using the proxy, so use relative path
        // When REACT_APP_API_URL is set, use the absolute URL
        const apiUrl = process.env.REACT_APP_API_URL ? 
          `${process.env.REACT_APP_API_URL}/api/payment/config` : 
          '/api/payment/config';
        console.log('API URL:', apiUrl);
        
        const cfg = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!cfg.ok) {
          console.error('Payment API response not OK:', cfg.status, cfg.statusText);
          throw new Error(`Payment API not reachable (status ${cfg.status}: ${cfg.statusText})`);
        }
        
        const configData = await cfg.json();
        console.log('Backend connectivity check successful:', configData);
        
        if (!configData.hasKeyId || !configData.hasKeySecret) {
          console.error('Payment gateway configuration issue:', configData);
          throw new Error('Payment gateway not properly configured on the server');
        }
      } catch (e) {
        console.error('Payment config check failed:', e);
        console.error('Error details:', e.stack);
        
        // More specific error messages
        let errorMessage = 'Failed to initiate online payment';
        if (e instanceof TypeError && e.message.includes('fetch')) {
          errorMessage += ': Network error or server unreachable. Please check if the backend server is running.';
        } else if (e.message) {
          errorMessage += ': ' + e.message;
        } else {
          errorMessage += ': Unknown error occurred';
        }
        
        alert(errorMessage);
        setLoading(false);
        return;
      }

      // Create Razorpay order
      console.log('Creating Razorpay order...');
      try {
        const orderPayload = {
          amount: cartTotal * 100, // Convert to paise
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          items: cartItems,
          deliveryAddress
        };
        console.log('Order payload:', orderPayload);
        
        // When REACT_APP_API_URL is not set, we're using the proxy, so use relative path
        // When REACT_APP_API_URL is set, use the absolute URL
        const apiUrl = process.env.REACT_APP_API_URL ? 
          `${process.env.REACT_APP_API_URL}/api/payment/create-order` : 
          '/api/payment/create-order';
        console.log('Create order endpoint:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          cache: 'no-cache',
          body: JSON.stringify(orderPayload)
        });

        const orderResponse = await response.json();
        console.log('Order creation response:', orderResponse);
        
        if (!response.ok || !orderResponse.success) {
          const backendMsg = orderResponse?.details?.description || orderResponse?.message || orderResponse?.error || 'Unknown error';
          console.error('Order creation failed:', response.status, backendMsg);
          
          let errorMessage = 'Failed to create payment order';
          if (response.status === 404) {
            errorMessage += ': Payment API endpoint not found. Please check if the backend server is running on the correct port.';
          } else if (response.status >= 500) {
            errorMessage += ': Server error. Please try again later.';
          } else {
            errorMessage += ': ' + backendMsg;
          }
          
          alert(errorMessage);
          setLoading(false);
          return;
        }
        
        if (!orderResponse.order || !orderResponse.order.id) {
          console.error('Invalid order response structure:', orderResponse);
          alert('Invalid order response from server. Please try again.');
          setLoading(false);
          return;
        }
        
        // Configure Razorpay options
        console.log('Configuring Razorpay payment...');
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
          amount: orderResponse.order.amount,
          currency: orderResponse.order.currency,
          name: 'MediHaven',
          description: 'Medicine Purchase',
          order_id: orderResponse.order.id,
          handler: async (response) => {
            console.log('Payment successful, handling response:', response);
            await verifyPaymentAndCreateOrder(response, orderResponse.order);
          },
          prefill: {
            name: deliveryAddress.fullName,
            email: currentUser.email,
            contact: deliveryAddress.mobile
          },
          notes: {
            address: `${deliveryAddress.address}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`
          },
          theme: {
            color: '#3B82F6'
          },
          modal: {
            ondismiss: () => {
              console.log('Payment window closed by user');
              setLoading(false);
            }
          }
        };

        console.log('Opening Razorpay payment form with options:', {
          key: options.key ? '***' : 'MISSING', // Don't log the actual key
          amount: options.amount,
          currency: options.currency,
          order_id: options.order_id
        });

        try {
          if (!window.Razorpay) {
            throw new Error('Razorpay not loaded');
          }
          const razorpay = new window.Razorpay(options);
          razorpay.on('payment.failed', function(response) {
            console.error('Payment failed:', response.error);
            alert(`Payment failed: ${response.error.description}`);
            setLoading(false);
          });
          razorpay.open();
        } catch (error) {
          console.error('Error opening Razorpay payment form:', error);
          alert('Failed to open payment form: ' + (error?.message || 'Unknown error'));
          setLoading(false);
        }
      } catch (error) {
        console.error('Order creation request failed:', error);
        console.error('Error details:', error.stack);
        alert('Failed to create payment order: ' + (error?.message || 'Network error'));
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Online payment error:', error);
      const message = error?.message || 'Unexpected error';
      alert('Failed to initiate online payment: ' + message);
      setLoading(false);
    }
  };

  const verifyPaymentAndCreateOrder = async (paymentResponse, razorpayOrder) => {
    try {
      console.log('Verifying payment with backend...', {
        orderId: paymentResponse.razorpay_order_id,
        paymentId: paymentResponse.razorpay_payment_id
      });
      console.log('Payment response to verify:', paymentResponse);
      
      // Verify payment with backend
      // When REACT_APP_API_URL is not set, we're using the proxy, so use relative path
      // When REACT_APP_API_URL is set, use the absolute URL
      const verifyApiUrl = process.env.REACT_APP_API_URL ? 
          `${process.env.REACT_APP_API_URL}/api/payment/verify` : 
          '/api/payment/verify';
      console.log('Verify payment endpoint:', verifyApiUrl);
        
      const verifyResponse = await fetch(verifyApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache',
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          userId: currentUser?.uid || 'guest',
          amount: razorpayOrder.amount,
          items: cartItems,
          deliveryAddress
        })
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error('Payment verification failed:', verifyResponse.status, errorText);
        throw new Error(`Payment verification failed (${verifyResponse.status}): ${errorText}`);
      }

      const verifyResult = await verifyResponse.json();
      console.log('Payment verification result:', verifyResult);
      
      if (verifyResult.success) {
        console.log('Payment verified successfully, creating order in Firestore...');
        
        // Create order in Firestore with payment details
        const orderData = {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          items: cartItems,
          totalAmount: cartTotal,
          deliveryAddress,
          customerLocation: customerLocation || null,
          paymentMethod: 'online',
          paymentStatus: 'completed',
          paymentDetails: {
            paymentId: paymentResponse.razorpay_payment_id,
            orderId: paymentResponse.razorpay_order_id,
            signature: paymentResponse.razorpay_signature,
            amount: razorpayOrder.amount / 100, // Convert from paise to rupees
            currency: razorpayOrder.currency,
            status: 'captured',
            timestamp: new Date().toISOString()
          },
          status: 'confirmed',
          createdAt: new Date().toISOString()
        };

        console.log('Creating order with data:', {
          userId: orderData.userId,
          totalAmount: orderData.totalAmount,
          paymentMethod: orderData.paymentMethod,
          itemCount: orderData.items.length
        });

        const result = await createOrder(orderData);
        
        if (result.success) {
          // Persist this address locally for faster future checkouts
          try {
            if (currentUser?.uid) {
              localStorage.setItem(`lastAddress_${currentUser.uid}`, JSON.stringify(deliveryAddress));
            }
          } catch (e) {
            console.warn('Unable to save lastAddress to localStorage:', e);
          }
          console.log('Order created successfully:', result.orderId);
          clearCartAndNavigate(result.orderId);
        } else {
          console.error('Failed to create order:', result.error);
          alert('Payment successful but failed to create order. Please contact support with this ID: ' + paymentResponse.razorpay_payment_id);
          setLoading(false);
        }
      } else {
        alert('Payment verification failed. Please contact support.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Payment verification failed. Please contact support.');
      setLoading(false);
    }
  };

  const clearCartAndNavigate = (orderId) => {
    // Clear cart if not buy now
    if (!buyNowItem) {
      const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
      localStorage.removeItem(cartKey);
      window.dispatchEvent(new Event('cartUpdated'));
    }
    
    navigate(`/order-confirmation/${orderId}`);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No items to checkout</h2>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Flow */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Login or Signup */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className={`px-6 py-4 border-b border-gray-200 flex items-center ${currentStep >= 1 ? 'bg-blue-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-4 ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  1
                </div>
                <h2 className="text-lg font-semibold text-gray-900">LOGIN OR SIGNUP</h2>
                {currentUser && (
                  <div className="ml-auto flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Logged in as {currentUser.email}
                  </div>
                )}
              </div>
              
              {!currentUser ? (
                <div className="p-6">
                  <p className="text-gray-600 mb-4">Please login to continue with your order</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-md"
                  >
                    LOGIN
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Easily Track Orders, Hassle free Returns
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Get Relevant Alerts and Recommendation
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Wishlist, Reviews, Ratings and more.
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className={`px-6 py-4 border-b border-gray-200 flex items-center ${currentStep >= 2 ? 'bg-blue-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-4 ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  2
                </div>
                <h2 className="text-lg font-semibold text-gray-900">DELIVERY ADDRESS</h2>
              </div>
              
              {currentStep >= 2 && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={deliveryAddress.fullName}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, fullName: e.target.value})}
                        className={`w-full border ${addressErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter full name"
                      />
                      {addressErrors.fullName && <p className="mt-1 text-xs text-red-600">{addressErrors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        value={deliveryAddress.mobile}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, mobile: e.target.value})}
                        className={`w-full border ${addressErrors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter mobile number"
                      />
                      {addressErrors.mobile && <p className="mt-1 text-xs text-red-600">{addressErrors.mobile}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={deliveryAddress.pincode}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                        className={`w-full border ${addressErrors.pincode ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter pincode"
                      />
                      {addressErrors.pincode && <p className="mt-1 text-xs text-red-600">{addressErrors.pincode}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                      <input
                        type="text"
                        value={deliveryAddress.locality}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, locality: e.target.value})}
                        className={`w-full border ${addressErrors.locality ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter locality"
                      />
                      {addressErrors.locality && <p className="mt-1 text-xs text-red-600">{addressErrors.locality}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={deliveryAddress.address}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, address: e.target.value})}
                        className={`w-full border ${addressErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        rows="3"
                        placeholder="Enter full address"
                      />
                      {addressErrors.address && <p className="mt-1 text-xs text-red-600">{addressErrors.address}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City/District/Town</label>
                      <input
                        type="text"
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                        className={`w-full border ${addressErrors.city ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter city"
                      />
                      {addressErrors.city && <p className="mt-1 text-xs text-red-600">{addressErrors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={deliveryAddress.state}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                        className={`w-full border ${addressErrors.state ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter state"
                      />
                      {addressErrors.state && <p className="mt-1 text-xs text-red-600">{addressErrors.state}</p>}
                    </div>
                  </div>

                  {/* Share live location (optional) */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locationLoading}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-xs font-medium border 
                        ${locationLoading ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300'}`}
                    >
                      {locationLoading ? 'Detecting your current location…' : 'Share my current location for faster delivery'}
                    </button>
                    {locationStatus && (
                      <p className="mt-1 text-xs text-gray-500">{locationStatus}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className={`px-6 py-4 border-b border-gray-200 flex items-center ${currentStep >= 3 ? 'bg-blue-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-4 ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  3
                </div>
                <h2 className="text-lg font-semibold text-gray-900">ORDER SUMMARY</h2>
              </div>
              
              {currentStep >= 3 && (
                <div className="p-6">
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                        <img
                          src={item.imageUrl || "https://placehold.co/300x300?text=No+Image"}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Payment Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className={`px-6 py-4 border-b border-gray-200 flex items-center ${currentStep >= 4 ? 'bg-blue-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-4 ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  4
                </div>
                <h2 className="text-lg font-semibold text-gray-900">PAYMENT OPTIONS</h2>
              </div>
              
              {currentStep >= 4 && (
                <div className="p-6">
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-gray-900">Cash on Delivery (COD)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-gray-900">Online Payment (UPI/Card/Net Banking)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">PRICE DETAILS</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price ({itemCount} items)</span>
                  <span className="text-gray-900">₹{cartTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Charges</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-gray-900">Total Amount</span>
                    <span className="text-gray-900">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="text-sm text-green-600 font-medium">
                  You will save ₹0 on this order
                </div>

                {cartItems.length > 0 && (safetyAnalysis.interactions.length > 0 || safetyAnalysis.allergyWarnings.length > 0) && (
                  <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.257 7.099c.765-1.36 2.722-1.36 3.486 0l2.829 4.971C15.31 13.431 14.523 15 13.242 15H6.758c-1.281 0-2.068-1.569-1.33-2.93l2.829-4.971zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-5a1 1 0 00-.894.553l-1.5 3A1 1 0 009.5 13h1a1 1 0 00.894-1.447l-1.5-3A1 1 0 0010 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-red-800">
                          Drug Interaction & Allergy Warnings
                        </p>
                        <ul className="mt-2 text-xs text-red-700 list-disc list-inside space-y-1">
                          {safetyAnalysis.interactions.map((issue, idx) => (
                            <li key={`interaction-${idx}`}>
                              {issue.message}
                            </li>
                          ))}
                          {safetyAnalysis.allergyWarnings.map((issue, idx) => (
                            <li key={`allergy-${idx}`}>
                              {issue.message}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[11px] text-red-600">
                          This information is for safety assistance only and does not replace advice from your doctor or pharmacist.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-6 pb-6">
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || !currentUser}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
                >
                  {loading ? 'Placing Order...' : currentStep < 4 ? 'CONTINUE' : 'PLACE ORDER'}
                </button>
              </div>
              
              {/* Safe and Secure */}
              <div className="px-6 pb-6 flex items-center text-sm text-gray-600">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Safe and Secure Payments. Easy returns. 100% Authentic products.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
