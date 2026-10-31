/*
 * Map images for Leaflet: Mapbox when a token is set (NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN), otherwise
 * OpenStreetMap. MapTilesLayer also falls back to OpenStreetMap if Mapbox refuses the images, so a bad
 * token gives a working map instead of a grey box. OpenStreetMap's terms don't allow production traffic.
 */
const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export const openStreetMapTiles = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  tileSize: 256,
  zoomOffset: 0,
};

export const mapTiles = token
  ? {
      url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${token}`,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      tileSize: 512,
      zoomOffset: -1,
    }
  : openStreetMapTiles;
