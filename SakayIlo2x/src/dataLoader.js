export const routeFiles = [
  "ROUTE  # 1 BO. OBRERO, LAPUZ TO CITY PROPER LOOP.geojson",
  "ROUTE # 11 LA PAZ – ILOILO CITY PROPER VIA ISATU2.geojson",
  "ROUTE # 15A (LIKO) MOLO – ILOILO CITY PROPER VIA BALUARTE LOOP JEEPNEY ROUTE2.geojson",
  "ROUTE # 15B (DERECHO) MOLO – ILOILO CITY PROPER VIA BALUARTE LOOP JEEPNEY ROUTE2.geojson",
  "ROUTE # 2 CALAPARAN CALUMPANG – ILOILO CITY PROPER2.geojson",
  "ROUTE # 3 UNGKA – ILOILO CITY PROPER VIA CPU2.geojson",
  "ROUTE # 4 UNGKA-ILOILO CITY VIA DIVERSION FESTIVE WALK TRANSPORT HUB LOOP2.geojson",
  "ROUTE # 5 FESTIVE WALK TRANSPORT HUB ILOILO CITY PROPER VIA SM CITY2.geojson",
  "ROUTE # 7 COMPANIA – ILOILO CITY PROPER LOOP2.geojson",
  "ROUTE # 9 MOHON – INFANTE LOOP2.geojson"
];

const colors = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#84cc16'  // Lime
];

function sanitizeName(filename) {
  // e.g. "ROUTE  # 1 BO. OBRERO, LAPUZ TO CITY PROPER LOOP.geojson"
  let name = filename.replace('.geojson', '');
  name = name.replace(/ROUTE\s*#\s*\w+\s*/i, ''); // Remove "ROUTE # 1 "
  return name.trim();
}

export async function loadRoutes() {
  const allFeatures = [];

  for (let i = 0; i < routeFiles.length; i++) {
    const file = routeFiles[i];
    try {
      const response = await fetch(`/src/data/${encodeURIComponent(file)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const geojson = await response.json();

      // Each file might be a FeatureCollection or a single Feature.
      // Usually these exports are FeatureCollections with one or more features.
      let featuresToProcess = [];
      if (geojson.type === 'FeatureCollection') {
        featuresToProcess = geojson.features;
      } else if (geojson.type === 'Feature') {
        featuresToProcess = [geojson];
      }

      featuresToProcess.forEach((feature, index) => {
        // Only keep LineString or MultiLineString
        if (feature.geometry && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString')) {
          const sanitizedFeature = {
            ...feature,
            properties: {
              route_id: `r_${i}_${index}`,
              route_name: sanitizeName(file),
              color: colors[i % colors.length]
            }
          };
          allFeatures.push(sanitizedFeature);
        }
      });

    } catch (err) {
      console.error(`Failed to load route data: ${file}`, err);
    }
  }

  return {
    type: 'FeatureCollection',
    features: allFeatures
  };
}
