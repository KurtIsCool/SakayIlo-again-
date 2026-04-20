import fs from 'fs';
import path from 'path';

export const routeFiles = [
  "route_11_la_paz_iloilo_city_proper_via_isatu2.geojson",
  "route_15a_liko_molo_iloilo_city_proper_via_baluarte_loop_jeepney_route2.geojson",
  "route_15b_derecho_molo_iloilo_city_proper_via_baluarte_loop_jeepney_route2.geojson",
  "route_1_bo._obrero_lapuz_to_city_proper_loop.geojson",
  "route_2_calaparan_calumpang_iloilo_city_proper2.geojson",
  "route_3_ungka_iloilo_city_proper_via_cpu2.geojson",
  "route_4_ungka_iloilo_city_via_diversion_festive_walk_transport_hub_loop2.geojson",
  "route_5_festive_walk_transport_hub_iloilo_city_proper_via_sm_city2.geojson",
  "route_7_compania_iloilo_city_proper_loop2.geojson",
  "route_9_mohon_infante_loop2.geojson"
];

const colors = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

function sanitizeName(filename) {
  let name = filename.replace(/\.geojson$/i, '');
  name = name.replace(/^route_([0-9]+[a-zA-Z]?)_/i, '');
  name = name.replace(/_iloilo_city_proper/i, ' - City Proper');
  name = name.replace(/_city_proper/i, ' - City Proper');
  name = name.replace(/_/g, ' ');
  name = name.replace(/\b\w/g, char => char.toUpperCase());
  return name.trim();
}

export async function loadRoutes() {
  const allFeatures = [];

  for (let i = 0; i < routeFiles.length; i++) {
    const file = routeFiles[i];
    try {
      // In tests, read from disk synchronously
      const filePath = path.join(process.cwd(), 'public/data', file);
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
