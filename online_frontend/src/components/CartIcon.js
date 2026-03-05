import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function CartIcon() {
  const { currentUser } = useAuth();
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
      const savedCart = localStorage.getItem(cartKey);
      
      console.log('🔔 CartIcon - Updating count:');
      console.log('🔑 Cart key:', cartKey);
      console.log('💾 Saved cart:', savedCart);
      
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          const count = parsedCart.reduce((total, item) => total + item.quantity, 0);
          console.log('📦 Parsed cart:', parsedCart);
          console.log('🔢 Count:', count);
          setItemCount(count);
        } catch (error) {
          console.log('❌ Parse error:', error);
          setItemCount(0);
        }
      } else {
        console.log('❌ No cart found, setting count to 0');
        setItemCount(0);
      }
    };
    
    // Update count on mount
    updateCartCount();
    
    // Listen for storage changes
    window.addEventListener('storage', updateCartCount);
    
    // Custom event for same-tab updates
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, [currentUser]);

  return (
    <Link to="/cart" className="group -m-2 p-2 flex items-center">
      <svg
        className="flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="ml-2 text-sm font-medium text-blue-600 group-hover:text-blue-800">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

export default CartIcon;