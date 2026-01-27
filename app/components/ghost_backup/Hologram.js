import React from 'react';
import styles from '../styles/Nebula.css';

function Hologram({ children }) {
  return (
    <div className={styles.hologram}>
      {children}
    </div>
  );
}

export default Hologram;