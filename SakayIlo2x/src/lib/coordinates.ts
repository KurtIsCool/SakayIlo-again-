// Semantic aliases
export type LeafletLatLng = [number, number]; // [Latitude, Longitude]
export type TurfPosition = [number, number];  // [Longitude, Latitude]

/**
 * Converts Leaflet [lat, lng] to Turf/GeoJSON [lng, lat]
 */
export function toTurfPosition(latLng: LeafletLatLng): TurfPosition {
  return [latLng[1], latLng[0]];
}

/**
 * Converts Turf/GeoJSON [lng, lat] to Leaflet [lat, lng]
 */
export function toLeafletLatLng(position: TurfPosition): LeafletLatLng {
  return [position[1], position[0]];
}
