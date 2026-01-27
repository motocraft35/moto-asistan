import React from 'react';
import './MapMarker.css';

const MapMarker = ({ location, onClick }) => {
  return (
    <div
      className="map-marker"
      style={{
        left: `${location.x}px`,
        top: `${location.y}px`,
      }}
      onClick={onClick}
    >
      <div className="holographic-effect">
        <div className="holographic-ring" />
        <div className="holographic-dot" />
      </div>
    </div>
  );
};

export default MapMarker;