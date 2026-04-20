import * as turf from '@turf/turf';
import type { FeatureCollection, LineString } from 'geojson';

// Define a few prominent routes in Iloilo City using Turf FeatureCollection format
export const iloiloRoutes: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: '1', name: 'Jaro Liko NFA', color: '#ff0000' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [122.5539, 10.7300], // Jaro (CPU area)
          [122.5562, 10.7225], // Jaro Plaza
          [122.5600, 10.7100], // E. Lopez St
          [122.5644, 10.6974], // City Proper (Plaza Libertad)
          [122.5680, 10.6920]  // Ortiz
        ]
      }
    },
    {
      type: 'Feature',
      properties: { id: '2', name: 'Mandurriao SM City', color: '#0055ff' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [122.5412, 10.7135], // Mandurriao Plaza
          [122.5458, 10.7110], // Megaworld
          [122.5500, 10.7088], // SM City
          [122.5555, 10.7050], // Diversion Road
          [122.5620, 10.7010], // UP Visayas
          [122.5644, 10.6974]  // City Proper (Intersecting Jaro Liko here)
        ]
      }
    },
    {
      type: 'Feature',
      properties: { id: '3', name: 'Molo Mandurriao', color: '#22aa22' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [122.5412, 10.7135], // Mandurriao Plaza
          [122.5400, 10.7000], // Tabucan
          [122.5460, 10.6950], // Molo Plaza
          [122.5500, 10.6920]  // GT Hotel Molo area
        ]
      }
    },
    {
      type: 'Feature',
      properties: { id: '4', name: 'Molo Baluarte', color: '#ffaa00' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [122.5460, 10.6950], // Molo Plaza
          [122.5500, 10.6920], // Boulevard (Intersecting Molo Mandurriao)
          [122.5580, 10.6900], // Baluarte
          [122.5680, 10.6920]  // Ortiz (Intersecting Jaro Liko here)
        ]
      }
    }
  ]
};
