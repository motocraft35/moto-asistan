import React from 'react';
import HolographicAnimation from './HolographicAnimation';
import NeonButton from './NeonButton';

const HolographicExperience = () => {
  const [isHolographic, setIsHolographic] = React.useState(false);

  const toggleHolographic = () => {
    setIsHolographic(!isHolographic);
  };

  return (
    <div className="holographic-experience">
      <HolographicAnimation isHolographic={isHolographic} />
      <NeonButton onClick={toggleHolographic}>
        Toggle Holographic
      </NeonButton>
    </div>
  );
};

export default HolographicExperience;