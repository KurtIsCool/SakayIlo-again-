import fs from 'fs';
import path from 'path';

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
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

function sanitizeName(filename) {
  let name = filename.replace('.geojson', '');
  name = name.replace(/ROUTE\s*#\s*\w+\s*/i, '');
  return name.trim();
}

export async function loadRoutes() {
  const allFeatures = [];

  for (let i = 0; i < routeFiles.length; i++) {
    const file = routeFiles[i];
    try {
      // In tests, read from disk synchronously
      const filePath = path.join(process.cwd(), 'src/data', file);
      const data = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(data);

      let featuresToProcess = [];
      if (geojson.type === 'FeatureCollection') {
        featuresToProcess = geojson.features;
      } else if (geojson.type === 'Feature') {
        featuresToProcess = [geojson];
      }

      featuresToProcess.forEach((feature, index) => {
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
