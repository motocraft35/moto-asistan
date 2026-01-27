import React from 'react';
import './CyberpunkButton.css';

const CyberpunkButton = ({ children, onClick }) => {
  return (
    <button className="cyberpunk-button" onClick={onClick}>
      {children}
    </button>
  );
};

export default CyberpunkButton;