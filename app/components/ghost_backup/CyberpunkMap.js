import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './CyberpunkMap.css';

const CyberpunkMap = () => {
  const [position, setPosition] = useState([51.505, -0.09]);

  useEffect(() => {
    const map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);
  }, []);

  return (
    <div className="cyberpunk-map">
      <MapContainer
        className="map"
        center={position}
        zoom={13}
        style={{ height: '500px' }}
      >
        <Marker position={position}>
          <Popup>
            <h2>Welcome to Cyberpunk City</h2>
            <p>This is a test marker.</p>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default CyberpunkMap;