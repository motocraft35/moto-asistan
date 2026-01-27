import React from 'react';
import CyberpunkNavigation from './CyberpunkNavigation';
import NeonButton from './NeonButton';
import Hologram from './Hologram';
import NeonRing from './NeonRing';

function Map() {
  return (
    <div className="container mx-auto p-4">
      <CyberpunkNavigation />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Map View</h1>
          <NeonButton onClick={() => console.log('Button clicked!')}>Click me!</NeonButton>
          <Hologram>
            <p className="text-lg font-bold mb-2">Hologram</p>
            <p className="text-sm">This is a hologram</p>
          </Hologram>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Ring View</h1>
          <NeonRing>
            <p className="text-lg font-bold mb-2">Neon Ring</p>
            <p className="text-sm">This is a neon ring</p>
          </NeonRing>
        </div>
      </div>
    </div>
  );
}

export default Map;