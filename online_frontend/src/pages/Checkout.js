import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { createOrder } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

function Checkout() {
  const { items, cartTotal, prescriptionRequired, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: currentUser?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "cod", // cod, card, upi
    upiId: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      // Calculate order summary
      const orderSummary = {
        subtotal: cartTotal,
        tax: cartTotal * 0.18, // 18% GST
        delivery: cartTotal > 500 ? 0 : 50, // Free delivery above ₹500
        total: cartTotal + (cartTotal * 0.18) + (cartTotal > 500 ? 0 : 50)
      };
      
      // Create order object
      const order = {
        userId: currentUser?.uid || 'guest',
        userEmail: formData.email,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          requiresPrescription: item.requiresPrescription || false
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: formData.phone
        },
        paymentMethod: formData.paymentMethod,
        totalAmount: orderSummary.total,
        subtotal: orderSummary.subtotal,
        tax: orderSummary.tax,
        delivery: orderSummary.delivery,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log("Prepared order object:", order);
      
      // Submit order to Firebase
      console.log("Submitting order to Firebase...");
      const result = await createOrder(order);
      console.log("Order creation result:", result);
      
      if (result.success) {
        console.log("Order created successfully with ID:", result.orderId);
        // Clear cart and redirect to order confirmation
        clearCart();
        navigate(`/order-confirmation/${result.orderId}`);
      } else {
        console.error("Failed to create order:", result.error);
        setError(result.error || "Failed to place order");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "An error occurred during checkout");
    } finally {
      setLoading(false);
    }
  };
  
  if (items.length === 0 && !loading) {
    navigate("/cart");
    return null;
  }
  
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Checkout</h1>
        
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-12">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit}>
                <div className="border-t border-gray-200 pt-10">
                  <h2 className="text-lg font-medium text-gray-900">Shipping information</h2>
                  
                  <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First name <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last name <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone number <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          required
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        State <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          required
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                        PIN code <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="pincode"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          required
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-10 border-t border-gray-200 pt-10">
                  <h2 className="text-lg font-medium text-gray-900">Payment method</h2>
                  
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center">
                      <input
                        id="cod"
                        name="paymentMethod"
                        type="radio"
                        value="cod"
                        checked={formData.paymentMethod === "cod"}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700">
                        Cash on Delivery
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="card"
                        name="paymentMethod"
                        type="radio"
                        value="card"
                        checked={formData.paymentMethod === "card"}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="card" className="ml-3 block text-sm font-medium text-gray-700">
                        Credit/Debit Card
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="upi"
                        name="paymentMethod"
                        type="radio"
                        value="upi"
                        checked={formData.paymentMethod === "upi"}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="upi" className="ml-3 block text-sm font-medium text-gray-700">
                        UPI
                      </label>
                    </div>
                  </div>
                  
                  {formData.paymentMethod === "upi" && (
                    <div className="mt-2">
                      <input
                        type="text"
                        name="upiId"
                        placeholder="username@upi"
                        value={formData.upiId || ""}
                        onChange={handleChange}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  )}
                  
                  {formData.paymentMethod !== "cod" && (
                    <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            For demo purposes, all payment methods will be processed as Cash on Delivery
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-10 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Place Order"}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="mt-16 lg:mt-0 lg:col-span-5">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 sm:p-6 lg:p-8">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                
                <div className="mt-6 flow-root">
                  <ul className="-my-4 divide-y divide-gray-200">
                    {items.map((item) => (
                      <li key={item.id} className="flex py-4">
                        <div className="flex-shrink-0">
                          <img
                            src={item.imageUrl || "https://via.placeholder.com/80x80?text=No+Image"}
                            alt={item.name}
                            className="w-16 h-16 rounded-md object-center object-cover"
                          />
                        </div>
                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>{item.name}</h3>
                              <p className="ml-4">₹{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                          </div>
                          <div className="flex-1 flex items-end justify-between text-sm">
                            <p className="text-gray-500">Qty {item.quantity}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Subtotal</p>
                    <p>₹{cartTotal.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Tax (18%)</p>
                    <p>₹{(cartTotal * 0.18).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500">Delivery</p>
                    <p>
                      {cartTotal > 500 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>₹50.00</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-between text-base font-medium text-gray-900">
                    <p>Total</p>
                    <p>₹{(cartTotal + (cartTotal * 0.18) + (cartTotal > 500 ? 0 : 50)).toFixed(2)}</p>
                  </div>
                </div>
                
                {prescriptionRequired && (
                  <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Your order contains prescription medicines. Please ensure you have uploaded a valid prescription.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;