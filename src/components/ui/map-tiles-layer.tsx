'use client';

import * as React from 'react';
import { TileLayer } from 'react-leaflet';
import { mapTiles, openStreetMapTiles } from '@/lib/map-tiles';

/** The map images; switches to OpenStreetMap if the first choice refuses them */
export default function MapTilesLayer() {
  const [fallback, setFallback] = React.useState(false);
  const tiles = fallback ? openStreetMapTiles : mapTiles;
  return <TileLayer key={tiles.url} url={tiles.url} attribution={tiles.attribution} tileSize={tiles.tileSize} zoomOffset={tiles.zoomOffset} eventHandlers={{ tileerror: () => setFallback(true) }} />;
}
