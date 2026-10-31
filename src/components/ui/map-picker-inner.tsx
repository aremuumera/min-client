'use client';

import * as React from 'react';
import { Circle, CircleMarker, MapContainer, Polygon, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LngLat } from '@/lib/locations';
import MapTilesLayer from './map-tiles-layer';

const GREEN = '#1e8742';

function Clicks({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))) });
  return null;
}

/** Sizes the map once the side sheet has slid in, and follows the chosen place when it moves far away */
function Keeper({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(t);
  }, [map]);
  React.useEffect(() => {
    if (!map.getBounds().contains(center)) map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export interface MapPickerInnerProps {
  center: [number, number];
  zoom: number;
  point: [number, number] | null;
  radius: number | null;
  outline: LngLat[];
  drawing: boolean;
  height: number;
  onClick?: (lat: number, lng: number) => void;
}

export default function MapPickerInner({ center, zoom, point, radius, outline, drawing, height, onClick }: MapPickerInnerProps) {
  const latLngs = outline.map(([lng, lat]) => [lat, lng] as [number, number]);
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height, width: '100%', cursor: onClick ? 'crosshair' : undefined }}>
      <MapTilesLayer />
      <Keeper center={center} zoom={zoom} />
      {onClick && <Clicks onClick={onClick} />}
      {point && <CircleMarker center={point} radius={7} pathOptions={{ color: '#ffffff', weight: 2, fillColor: GREEN, fillOpacity: 1 }} />}
      {point && radius ? <Circle center={point} radius={radius} pathOptions={{ color: GREEN, weight: 2, fillOpacity: 0.12 }} /> : null}
      {drawing && latLngs.length < 3 && latLngs.length > 0 && <Polyline positions={latLngs} pathOptions={{ color: GREEN, weight: 2, dashArray: '4 4' }} />}
      {latLngs.length >= 3 && <Polygon positions={latLngs} pathOptions={{ color: GREEN, weight: 2, fillOpacity: 0.12 }} />}
      {drawing && latLngs.map((p, i) => <CircleMarker key={i} center={p} radius={4} pathOptions={{ color: GREEN, weight: 2, fillColor: '#ffffff', fillOpacity: 1 }} />)}
    </MapContainer>
  );
}
