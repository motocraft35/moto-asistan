import React from 'react';
import styles from './Tabs.module.css';

const Tabs = () => {
  return (
    <div className={styles.tabs}>
      <button className={styles.tab}>Tab 1</button>
      <button className={styles.tab}>Tab 2</button>
      <button className={styles.tab}>Tab 3</button>
    </div>
  );
};

export default Tabs;