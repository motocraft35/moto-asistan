import React from 'react';
import { Mapbox } from '@mapbox/mapbox-gl';

const ScanLines = ({ map }) => {
  const scanLines = [];

  for (let i = 0; i < 10; i++) {
    const line = document.createElement('div');
    line.className = 'scan-line';
    map.addLayer({
      id: `scan-line-${i}`,
      type: 'line',
      source: {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-122.084051, 37.385348],
              [-122.084051, 37.385348 + (i * 0.1)],
            ],
          },
        },
      },
      layout: {
        'line-color': 'white',
        'line-width': 2,
      },
    });
    scanLines.push(line);
  }

  return (
    <div className="scan-lines">
      {scanLines.map((line, index) => (
        <div key={index} ref={(el) => (line = el)} />
      ))}
    </div>
  );
};

export default ScanLines;