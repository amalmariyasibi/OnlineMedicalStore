import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

function CartIcon() {
  const { itemCount } = useCart();

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