import React, { useState } from 'react';
import Mapbox from 'mapbox-gl';
import styles from '../styles/globals.css';

const HolographicMarker = ({ marker }) => {
  const [opacity, setOpacity] = useState(1);

  const handleSliderChange = (event) => {
    setOpacity(parseFloat(event.target.value));
  };

  return (
    <div className={styles.holographicMarker}>
      <input type="range" min="0" max="1" step="0.01" value={opacity} onChange={handleSliderChange} />
      <div style={{ opacity }}>
        {/* Render the holographic marker */}
      </div>
    </div>
  );
};