import React from 'react';
import styles from '../styles/Nebula.css';

function CyberpunkNavigation() {
  return (
    <nav className={styles.cyberpunkNavigation}>
      <ul className="flex justify-between items-center">
        <li className="text-lg font-bold">Home</li>
        <li className="text-lg font-bold">Settings</li>
        <li className="text-lg font-bold">Account</li>
      </ul>
    </nav>
  );
}

export default CyberpunkNavigation;