import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

// Initial state
const initialState = {
  items: [],
  loading: false,
  error: null,
  prescriptionRequired: false,
};

// Actions
const ADD_TO_CART = "ADD_TO_CART";
const REMOVE_FROM_CART = "REMOVE_FROM_CART";
const UPDATE_QUANTITY = "UPDATE_QUANTITY";
const CLEAR_CART = "CLEAR_CART";
const SET_LOADING = "SET_LOADING";
const SET_ERROR = "SET_ERROR";

// Reducer
function cartReducer(state, action) {
  switch (action.type) {
    case ADD_TO_CART: {
      const { product, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === product.id);
      
      let newItems;
      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
      } else {
        // Add new item
        newItems = [...state.items, { ...product, quantity }];
      }
      
      // Check if any product requires prescription
      const prescriptionRequired = newItems.some(item => item.requiresPrescription);
      
      return {
        ...state,
        items: newItems,
        prescriptionRequired,
      };
    }
    
    case REMOVE_FROM_CART: {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const prescriptionRequired = newItems.some(item => item.requiresPrescription);
      
      return {
        ...state,
        items: newItems,
        prescriptionRequired,
      };
    }
    
    case UPDATE_QUANTITY: {
      const { id, quantity } = action.payload;
      const newItems = state.items.map(item => 
        item.id === id ? { ...item, quantity } : item
      );
      
      return {
        ...state,
        items: newItems,
      };
    }
    
    case CLEAR_CART:
      return {
        ...state,
        items: [],
        prescriptionRequired: false,
      };
    
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    default:
      return state;
  }
}

// Provider component
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { currentUser } = useAuth();
  
  // Simple localStorage save (no complex loading on init)
  useEffect(() => {
    const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
    
    if (state.items.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(state.items));
    } else {
      localStorage.removeItem(cartKey);
    }
  }, [state.items, currentUser]);
  
  // Calculate cart totals
  const cartTotal = state.items.reduce(
    (total, item) => total + item.price * item.quantity, 
    0
  );
  
  const itemCount = state.items.reduce(
    (count, item) => count + item.quantity, 
    0
  );
  
  // Simple add to cart (no complex Firebase fetching)
  const addToCart = async (productId, quantity = 1) => {
    try {
      console.log('🛒 Simple add to cart:', productId, quantity);
      dispatch({ type: SET_LOADING, payload: true });
      dispatch({ type: SET_ERROR, payload: null });
      
      // For now, create a simple product object
      // In a real app, you'd fetch the product details
      const product = {
        id: productId,
        name: `Product ${productId}`,
        price: 100, // Default price
        stockQuantity: 10,
        category: 'General',
        requiresPrescription: false,
        imageUrl: 'https://placehold.co/300x300?text=Product'
      };
      
      dispatch({ 
        type: ADD_TO_CART, 
        payload: { product, quantity } 
      });
      
      console.log('✅ Added to cart successfully!');
      dispatch({ type: SET_LOADING, payload: false });
      return true;
    } catch (error) {
      console.error('❌ Add to cart error:', error);
      dispatch({ 
        type: SET_ERROR, 
        payload: error.message || "An error occurred" 
      });
      return false;
    }
  };
  
  // Add full product object to cart
  const addFullProductToCart = async (product, quantity = 1) => {
    try {
      console.log('🛒 Adding full product to cart:', product, quantity);
      dispatch({ type: SET_LOADING, payload: true });
      dispatch({ type: SET_ERROR, payload: null });
      
      // Validate product object
      if (!product || !product.id) {
        throw new Error('Invalid product object');
      }
      
      dispatch({ 
        type: ADD_TO_CART, 
        payload: { product, quantity } 
      });
      
      console.log('✅ Product added to cart successfully!');
      dispatch({ type: SET_LOADING, payload: false });
      return true;
    } catch (error) {
      console.error('❌ Add product to cart error:', error);
      dispatch({ 
        type: SET_ERROR, 
        payload: error.message || "An error occurred" 
      });
      dispatch({ type: SET_LOADING, payload: false });
      return false;
    }
  };
  
  // Remove from cart
  const removeFromCart = (productId) => {
    dispatch({ type: REMOVE_FROM_CART, payload: productId });
  };
  
  // Update quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({ 
        type: UPDATE_QUANTITY, 
        payload: { id: productId, quantity } 
      });
    }
  };
  
  // Clear cart
  const clearCart = () => {
    dispatch({ type: CLEAR_CART });
  };
  
  const value = {
    ...state,
    cartTotal,
    itemCount,
    addToCart,
    addFullProductToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
