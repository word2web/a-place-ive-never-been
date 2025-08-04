import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Icon } from 'ol/style';
import Circle from 'ol/geom/Circle';
import { Fill, Stroke } from 'ol/style';

interface MapViewProps {
  startLat: number;
  startLon: number;
  destLat?: number; // optional
  destLon?: number; // optional
  radius: number;   // the value from your slider
  useMetric: boolean; // true = km, false = miles
}

const MapView: React.FC<MapViewProps> = ({ startLat, startLon, destLat, destLon, radius, useMetric }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
  
    // START MARKER (Red pin)
    const startMarker = new Feature({
      geometry: new Point(fromLonLat([startLon, startLat])),
    });
    startMarker.setStyle(
      new Style({
        image: new Icon({
          src: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          anchor: [0.5, 1],
          scale: 1,
        }),
      })
    );
  
    // DESTINATION MARKER (Green pin, if present)
    let destMarker: Feature<Point> | null = null;
    if (typeof destLat === 'number' && typeof destLon === 'number') {
      destMarker = new Feature({
        geometry: new Point(fromLonLat([destLon, destLat])),
      });
      destMarker.setStyle(
        new Style({
          image: new Icon({
            src: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            anchor: [0.5, 1],
            scale: 1,
          }),
        })
      );
    }
  
    // RADIUS CIRCLE
    const radiusMeters = useMetric ? radius * 1000 : radius * 1609.34;
    const circle = new Feature({
      geometry: new Circle(fromLonLat([startLon, startLat]), radiusMeters),
    });
    circle.setStyle(
      new Style({
        stroke: new Stroke({ color: '#1976d2', width: 2 }),
        fill: new Fill({ color: 'rgba(25, 118, 210, 0.1)' }),
      })
    );
  
    // COLLECT FEATURES
    const features = [startMarker, circle];
    if (destMarker) features.push(destMarker);
  
    // VECTOR LAYER
    const vectorLayer = new VectorLayer({
      source: new VectorSource({ features }),
    });
  
    // MAP INSTANCE
    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([startLon, startLat]),
        zoom: 12,
      }),
      controls: [],
    });

const source = vectorLayer.getSource();
if (source) {
  const extent = source.getExtent();
  mapInstance.current.getView().fit(extent, {
    padding: [40, 40, 40, 40],
    maxZoom: 14,
  });
}
  
    // CLEANUP
    return () => {
      mapInstance.current?.setTarget(undefined);
    };
  }, [startLat, startLon, destLat, destLon, radius, useMetric]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        style={{ width: '100%', height: '350px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      />
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-md text-sm">
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Start location</span>
        </div>
        {destLat && destLon && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>New destination</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
