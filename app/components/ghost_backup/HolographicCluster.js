import React, { useState } from 'react';
import Mapbox from 'mapbox-gl';
import styles from '../styles/globals.css';

const HolographicCluster = ({ cluster }) => {
  const [visible, setVisible] = useState(true);

  const handleToggleVisibility = () => {
    setVisible(!visible);
  };

  return (
    <div className={styles.holographicCluster}>
      <button onClick={handleToggleVisibility}>Toggle Visibility</button>
      {visible && (
        <div>
          {/* Render the holographic cluster */}
        </div>
      )}
    </div>
  );
};