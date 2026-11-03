'use client';

import * as React from 'react';
import { Circle, CircleMarker, MapContainer, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapTilesLayer from './map-tiles-layer';

const GREEN = '#1e8742';
const INK = '#14201a';

export interface TrackMapPlace {
  label: string;
  latitude: number;
  longitude: number;
  radius?: number | null;
  kind: 'site' | 'checkpoint';
  done?: boolean;
}

export interface TrackMapInnerProps {
  places: TrackMapPlace[];
  trail: [number, number][];
  live: { latitude: number; longitude: number; label: string } | null;
  height: number;
}

/** Fits the map to everything on it once, then leaves the viewer in control */
function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  const done = React.useRef(false);
  React.useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(t);
  }, [map]);
  React.useEffect(() => {
    if (done.current || !points.length) return;
    done.current = true;
    if (points.length === 1) map.setView(points[0], 12);
    else map.fitBounds(points, { padding: [24, 24] });
  }, [map, points]);
  return null;
}

export default function TrackMapInner({ places, trail, live, height }: TrackMapInnerProps) {
  const all: [number, number][] = [...places.map((p) => [p.latitude, p.longitude] as [number, number]), ...trail, ...(live ? [[live.latitude, live.longitude] as [number, number]] : [])];
  return (
    <MapContainer center={all[0] ?? [9.08, 8.68]} zoom={all.length ? 8 : 5} scrollWheelZoom={false} style={{ height, width: '100%' }}>
      <MapTilesLayer />
      <Fit points={all} />
      {places.map((p, i) => (
        <React.Fragment key={`${p.label}-${i}`}>
          {p.radius ? <Circle center={[p.latitude, p.longitude]} radius={p.radius} pathOptions={{ color: p.kind === 'site' ? INK : GREEN, weight: 1, fillOpacity: 0.06 }} /> : null}
          <CircleMarker center={[p.latitude, p.longitude]} radius={p.kind === 'site' ? 7 : 5} pathOptions={{ color: '#ffffff', weight: 2, fillColor: p.kind === 'site' ? INK : p.done ? GREEN : '#9aa5a0', fillOpacity: 1 }}>
            <Tooltip>{p.label}</Tooltip>
          </CircleMarker>
        </React.Fragment>
      ))}
      {trail.length > 1 && <Polyline positions={trail} pathOptions={{ color: GREEN, weight: 3 }} />}
      {live && (
        <CircleMarker center={[live.latitude, live.longitude]} radius={9} pathOptions={{ color: '#ffffff', weight: 3, fillColor: GREEN, fillOpacity: 1 }}>
          <Tooltip permanent direction="top">{live.label}</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
