import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const CartContext = createContext();

// Helper function to get product by ID
const getProductById = async (productId) => {
  try {
    // First try to find in products collection
    let productRef = doc(db, "products", productId);
    let productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      return { 
        success: true, 
        product: { id: productSnap.id, ...productSnap.data(), type: "product" } 
      };
    }
    
    // If not found, try medicines collection
    productRef = doc(db, "medicines", productId);
    productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      return { 
        success: true, 
        product: { id: productSnap.id, ...productSnap.data(), type: "medicine" } 
      };
    }
    
    return { success: false, error: "Product not found" };
  } catch (error) {
    console.error("Error getting product:", error);
    return { success: false, error: error.message };
  }
};

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
const HYDRATE_CART = "HYDRATE_CART";

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
      // Check if any remaining product requires prescription
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
    
    case HYDRATE_CART:
      return {
        ...state,
        items: action.payload,
        prescriptionRequired: action.payload.some(item => item.requiresPrescription),
      };
    
    default:
      return state;
  }
}

// Provider component
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { currentUser } = useAuth();
  
  // Load cart from localStorage when component mounts or user changes
  useEffect(() => {
    const loadCart = async () => {
      try {
        // Get cart key based on user status (logged in or guest)
        const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
        const savedCart = localStorage.getItem(cartKey);
        
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          
          // Fetch fresh product data for each item to ensure prices and availability are current
          dispatch({ type: SET_LOADING, payload: true });
          
          const updatedItems = [];
          for (const item of parsedCart) {
            try {
              const result = await getProductById(item.id);
              if (result.success) {
                const product = result.product;
                
                // Only add if product is still in stock
                if (product.stockQuantity > 0) {
                  // Update with fresh product data but keep the quantity from cart
                  // Ensure quantity doesn't exceed current stock
                  updatedItems.push({
                    ...product,
                    quantity: Math.min(item.quantity, product.stockQuantity)
                  });
                }
              }
            } catch (error) {
              console.error(`Error fetching product ${item.id}:`, error);
            }
          }
          
          dispatch({ type: HYDRATE_CART, payload: updatedItems });
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        dispatch({ type: SET_ERROR, payload: "Failed to load your cart" });
      } finally {
        dispatch({ type: SET_LOADING, payload: false });
      }
    };
    
    loadCart();
  }, [currentUser]);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Get cart key based on user status (logged in or guest)
    const cartKey = currentUser ? `cart_${currentUser.uid}` : 'cart_guest';
    
    if (state.items.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(state.items));
    } else {
      // Clear storage if cart is empty
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
  
  // Add to cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      
      // Fetch fresh product data
      const result = await getProductById(productId);
      
      if (result.success) {
        const product = result.product;
        
        // Check if product is in stock
        if (product.stockQuantity <= 0) {
          dispatch({ 
            type: SET_ERROR, 
            payload: "Sorry, this product is out of stock" 
          });
          return false;
        }
        
        // Check if requested quantity is available
        if (quantity > product.stockQuantity) {
          dispatch({ 
            type: SET_ERROR, 
            payload: `Only ${product.stockQuantity} items available` 
          });
          return false;
        }
        
        dispatch({ 
          type: ADD_TO_CART, 
          payload: { product, quantity } 
        });
        
        dispatch({ type: SET_ERROR, payload: null });
        return true;
      } else {
        dispatch({ 
          type: SET_ERROR, 
          payload: result.error || "Failed to add product to cart" 
        });
        return false;
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      dispatch({ 
        type: SET_ERROR, 
        payload: error.message || "An error occurred" 
      });
      return false;
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  };
  
  // Remove from cart
  const removeFromCart = (productId) => {
    dispatch({ type: REMOVE_FROM_CART, payload: productId });
  };
  
  // Update quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      // Check if user is logged in
      if (!currentUser) {
        dispatch({ 
          type: SET_ERROR, 
          payload: "Please log in to update your cart" 
        });
        return false;
      }
      
      if (quantity <= 0) {
        removeFromCart(productId);
        return true;
      }
      
      // Get current product data to check stock
      const result = await getProductById(productId);
      
      if (result.success) {
        const product = result.product;
        
        // Check if requested quantity is available
        if (quantity > product.stockQuantity) {
          dispatch({ 
            type: SET_ERROR, 
            payload: `Only ${product.stockQuantity} items available` 
          });
          return false;
        }
        
        dispatch({ 
          type: UPDATE_QUANTITY, 
          payload: { id: productId, quantity } 
        });
        
        dispatch({ type: SET_ERROR, payload: null });
        return true;
      } else {
        dispatch({ 
          type: SET_ERROR, 
          payload: result.error || "Failed to update cart" 
        });
        return false;
      }
    } catch (error) {
      console.error("Update quantity error:", error);
      dispatch({ 
        type: SET_ERROR, 
        payload: error.message || "An error occurred" 
      });
      return false;
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