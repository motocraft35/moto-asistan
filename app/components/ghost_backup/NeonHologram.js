import React, { useState, useEffect } from 'react';
import './NeonHologram.css';

const NeonHologram = () => {
  const [rotate, setRotate] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRotate((prevRotate) => prevRotate + 1);
    }, 100);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="neon-hologram">
      <div className="hologram">
        <div className="motorcycle" style={{ transform: `rotateY(${rotate}deg)` }} />
        <div className="neon-lights">
          <div className="light" style={{ transform: `rotateY(${rotate}deg)` }} />
          <div className="light" style={{ transform: `rotateY(${rotate}deg)` }} />
          <div className="light" style={{ transform: `rotateY(${rotate}deg)` }} />
          <div className="light" style={{ transform: `rotateY(${rotate}deg)` }} />
        </div>
      </div>
    </div>
  );
};

export default NeonHologram;