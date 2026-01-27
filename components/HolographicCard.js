import React from 'react';
import './HolographicCard.css';

const HolographicCard = ({ title, subtitle, content }) => {
  return (
    <div className="holographic-card">
      <div className="card-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="card-content">
        <p style={{ fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {content}
        </p>
      </div>
    </div>
  );
};

export default HolographicCard;