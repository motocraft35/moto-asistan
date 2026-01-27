import React from 'react';
import NeonHologram from './NeonHologram';
import CyberpunkButton from './CyberpunkButton';

const NeonSearchBar = () => {
  const handleSearch = () => {
    console.log('Search button clicked!');
  };

  return (
    <div className="neon-search-bar">
      <NeonHologram />
      <input type="search" placeholder="Search" />
      <CyberpunkButton onClick={handleSearch}>Search</CyberpunkButton>
    </div>
  );
};

export default NeonSearchBar;