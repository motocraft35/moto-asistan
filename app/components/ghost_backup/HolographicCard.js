import React from 'react';
import { Card } from '@material-ui/core';

const HolographicCard = ({ children }) => {
  return (
    <Card className="holographic-card">
      {children}
    </Card>
  );
};

export default HolographicCard;