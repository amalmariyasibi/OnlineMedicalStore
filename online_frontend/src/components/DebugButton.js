import React from 'react';

const DebugButton = () => {
  const handleClick = () => {
    console.log('🔥 DEBUG BUTTON CLICKED!');
    alert('DEBUG BUTTON WORKS!');
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleClick}
        className="bg-red-500 text-white px-4 py-2 rounded shadow-lg hover:bg-red-600"
      >
        DEBUG TEST
      </button>
    </div>
  );
};

export default DebugButton;
