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
  
    // START MARKER
    const marker = new Feature({
      geometry: new Point(fromLonLat([startLon, startLat])),
    });
    marker.setStyle(
      new Style({
        image: new Icon({
          src: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          anchor: [0.5, 1],
          scale: 1,
        }),
      })
    );
  
    // DESTINATION MARKER (if present)
    let destMarker: Feature<Point> | null = null;
    if (typeof destLat === 'number' && typeof destLon === 'number') {
      destMarker = new Feature({
        geometry: new Point(fromLonLat([destLon, destLat])),
      });
      destMarker.setStyle(
        new Style({
          image: new Icon({
            src: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
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
    const features = [marker, circle];
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
    <div
      ref={mapRef}
      style={{ width: '100%', height: '350px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    />
  );
};

export default MapView;
