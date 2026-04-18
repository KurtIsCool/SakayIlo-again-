export const mockRoutesDB = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'r1', name: 'Jaro Liko NFA', color: '#ef4444' }, // Red
      geometry: {
        type: 'LineString',
        coordinates: [
          [122.5539, 10.7300], // Jaro (CPU)
          [122.5562, 10.7225], // Jaro Plaza
          [122.5600, 10.7100], // E. Lopez St
          [122.5644, 10.6974], // City Proper (Intersect hub)
          [122.5680, 10.6920]  // Ortiz
        ]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'r2', name: 'Mandurriao SM City', color: '#3b82f6' }, // Blue
      geometry: {
        type: 'LineString',
        coordinates: [
          [122.5412, 10.7135], // Mandurriao Plaza
          [122.5500, 10.7088], // SM City
          [122.5555, 10.7050], // Diversion
          [122.5620, 10.7010], // UP Visayas
          [122.5644, 10.6974]  // City Proper (Intersects Jaro Liko)
        ]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'r3', name: 'Molo Mandurriao', color: '#10b981' }, // Green
      geometry: {
        type: 'LineString',
        coordinates: [
          [122.5412, 10.7135], // Mandurriao Plaza (Intersects Mandurriao SM City)
          [122.5400, 10.7000], // Tabucan
          [122.5460, 10.6950], // Molo Plaza
          [122.5500, 10.6920]  // GT Hotel Molo
        ]
      }
    }
  ]
};
