import React, { useState, useEffect } from 'react';
import POI from './POI';

function POIContainer() {
  const [locations, setLocations] = useState({});

  useEffect(() => {
    // Data Caching (POI)
    const fetchLocations = async () => {
      const response = await fetch('/api/map/locations');
      const locations = await response.json();
      setLocations(locations);
    };

    fetchLocations();
  }, []);

  return (