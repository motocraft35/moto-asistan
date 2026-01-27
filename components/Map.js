import React, { useEffect, useState } from 'react';
import MapLibreGL from 'maplibre-gl';

function Map() {
  const [map, setMap] = useState(null);
  const [tiles, setTiles] = useState({});

  useEffect(() => {
    // MapLibre-GL oluşturma
    const map = new MapLibreGL.Map({
      container: 'map',
      style: 'https://api.maplibre.com/styles/v8-9.1.1/style.json',
      center: [35.6895, 139.7670],
      zoom: 14,
    });

    // IndexedDB oluşturma
    const db = indexedDB.open('mapdb', 1);

    db.onsuccess = () => {
      const transaction = db.transaction(['tiles'], 'readwrite');
      const store = transaction.objectStore('tiles');

      // Tile'ları önbellekleme
      map.on('load', () => {
        const tiles = map.getStyle().layers.filter((layer) => layer.type === 'raster');
        tiles.forEach((tile) => {
          const tileId = tile.id;
          const tileUrl = tile.source.url;
          const tileData = fetch(tileUrl).then((response) => response.arrayBuffer());

          // IndexedDB'ye tile'ları kaydetme
          store.add({ tileId, tileData }).onsuccess = () => {
            setTiles((prevTiles) => ({ ...prevTiles, [tileId]: tileData }));
          };
        });
      });
    };

    setMap(map);
  }, []);

  return (
    <div>
      <div id="map" style={{ width: '100%', height: '600px' }}></div>
    </div>
  );
}

export default Map;