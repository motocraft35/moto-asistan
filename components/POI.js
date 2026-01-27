import React, { useEffect, useState } from 'react';

function POI() {
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
    <div>
      {Object.keys(locations).map((location) => (
        <div key={location}>{location}</div>
      ))}
    </div>
  );
}

export default POI;