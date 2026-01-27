import React, { useState, useEffect } from 'react';
import styles from './HolographicAnimation.css';

const HolographicAnimation = ({ isHolographic }) => {
  const [animation, setAnimation] = useState(false);

  useEffect(() => {
    if (isHolographic) {
      setAnimation(true);
    } else {
      setAnimation(false);
    }
  }, [isHolographic]);

  return (
    <div
      className={`${styles.holographicAnimation} holographic-animation`}
      style={{
        opacity: isHolographic ? 1 : 0,
        transform: isHolographic ? 'scale(1)' : 'scale(0)',
      }}
    >
      {/* Animation content will go here */}
    </div>
  );
};

export default HolographicAnimation;