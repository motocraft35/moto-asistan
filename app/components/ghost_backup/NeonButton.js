import React from 'react';
import styles from '../styles/Nebula.css';

function NeonButton({ children, onClick }) {
  return (
    <button className={styles.neonButton} onClick={onClick}>
      {children}
    </button>
  );
}

export default NeonButton;