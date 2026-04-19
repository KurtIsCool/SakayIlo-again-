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
  let name = filename.replace(/\.geojson$/i, '');
  // Remove "route_<number>_" prefix
  name = name.replace(/^route_([0-9]+[a-zA-Z]?)_/i, '');
  // Replace underscores with spaces
  name = name.replace(/_/g, ' ');
  // Capitalize properly
  name = name.replace(/\b\w/g, char => char.toUpperCase());
  return name.trim();
}

export async function loadRoutes() {
  const allFeatures = [];

  const promises = routeFiles.map(async (file, i) => {
    try {
      const response = await fetch(`./data/${encodeURIComponent(file)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const geojson = await response.json();

      // Each file might be a FeatureCollection or a single Feature.
      // Usually these exports are FeatureCollections with one or more features.
      let featuresToProcess = [];
      if (geojson.type === 'FeatureCollection' && geojson.features) {
        featuresToProcess = geojson.features;
      } else if (geojson.type === 'Feature') {
        featuresToProcess = [geojson];
      }

      featuresToProcess.forEach((feature, index) => {
        // Only keep LineString or MultiLineString
        if (feature && feature.geometry && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString')) {
          const sanitizedFeature = {
            type: 'Feature',
            geometry: feature.geometry,
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
  });

  await Promise.all(promises);

  return {
    type: 'FeatureCollection',
    features: allFeatures
  };
}
