import { loadRoutes } from './dataLoader.js';

let routesDB;
let startMarker;
let endMarker;
let drawnLines;

async function init() {
  routesDB = await loadRoutes();

  // 1. Initialize Map
  const map = L.map('map').setView([10.706, 122.558], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // 2. Draw mock background routes
  routesDB.features.forEach(feature => {
    const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);
    L.polyline(coords, {
      color: feature.properties.color || '#333',
      weight: 4,
      opacity: 0.5,
      dashArray: '5,5'
    }).addTo(map);
  });

  // 3. UI State Setup
  drawnLines = L.layerGroup().addTo(map); // Layer group to easily clear previous routes

  // Custom markers
  const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  startMarker = L.marker([10.722, 122.556], { draggable: true, icon: startIcon }).addTo(map);
  endMarker = L.marker([10.6974, 122.5644], { draggable: true, icon: endIcon }).addTo(map);

  // 5. Setup Listeners
  startMarker.on('dragend', calculateRoute);
  endMarker.on('dragend', calculateRoute);
  document.getElementById('walkDist').addEventListener('input', calculateRoute);

  // Run initial route calculation
  calculateRoute();
}

// 4. Engine Functions
function findNearbyRoutes(point, routes, maxWalk) {
  const nearby = [];
  try {
    turf.featureEach(routes, (route) => {
      const snapped = turf.nearestPointOnLine(route, point);
      const dist = turf.distance(point, snapped, { units: 'kilometers' }) * 1000;
      if (dist <= maxWalk) {
        nearby.push({ route, nearestPoint: snapped, distance: dist });
      }
    });
  } catch (err) {
    console.error('[ERROR] findNearbyRoutes failed:', err);
  }
  return nearby;
}

function calculateRoute() {
  console.log('--- STARTING ROUTE CALCULATION ---');
  // CLEAR UI STATE: Remove any old route lines drawn on the map to prevent UI spaghetti
  drawnLines.clearLayers();

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<p>Calculating...</p>';

  const maxWalk = parseInt(document.getElementById('walkDist').value) || 800;

  const startLatLng = startMarker.getLatLng();
  const endLatLng = endMarker.getLatLng();

  console.log(`[DEBUG] Start Marker: [${startLatLng.lng}, ${startLatLng.lat}]`);
  console.log(`[DEBUG] End Marker: [${endLatLng.lng}, ${endLatLng.lat}]`);

  try {
    const startPt = turf.point([startLatLng.lng, startLatLng.lat]);
    const endPt = turf.point([endLatLng.lng, endLatLng.lat]);

    const startNearby = findNearbyRoutes(startPt, routesDB, maxWalk);
    const endNearby = findNearbyRoutes(endPt, routesDB, maxWalk);

    console.log('[DEBUG] Nearby Start Routes found:', startNearby.map(n => n.route.properties.route_name));
    console.log('[DEBUG] Nearby End Routes found:', endNearby.map(n => n.route.properties.route_name));

    // A. DIRECT ROUTE PRIORITY
    let bestDirect = null;
    let minDirectDist = Infinity;

    for (let s of startNearby) {
      for (let e of endNearby) {
        if (s.route.properties.route_id === e.route.properties.route_id) {
          try {
            const slice = turf.lineSlice(s.nearestPoint, e.nearestPoint, s.route);
            const rideDist = turf.length(slice, { units: 'kilometers' }) * 1000;
            if (rideDist < 50) continue;

            const totalDist = s.distance + rideDist + e.distance;
            if (totalDist < minDirectDist) {
              minDirectDist = totalDist;
              bestDirect = { s, e, slice, rideDist, totalDist };
            }
          } catch(err) {
            console.error(`[ERROR] Direct Route check failed for ${s.route.properties.route_name}:`, err);
          }
        }
      }
    }

    if (bestDirect) {
      console.log('[SUCCESS] Direct route found:', bestDirect.s.route.properties.route_name);

      const coords = bestDirect.slice.geometry.coordinates.map(c => [c[1], c[0]]);
      L.polyline(coords, { color: '#000000', weight: 6 }).addTo(drawnLines);

      resultsDiv.innerHTML = `
        <h3>Direct Route (1 Ride)</h3>
        <div class="step">🚶 Walk ${Math.round(bestDirect.s.distance)}m to ${bestDirect.s.route.properties.route_name}</div>
        <div class="step" style="border-left: 4px solid ${bestDirect.s.route.properties.color}">🚙 Ride ${Math.round(bestDirect.rideDist)}m on ${bestDirect.s.route.properties.route_name}</div>
        <div class="step">🚶 Walk ${Math.round(bestDirect.e.distance)}m to Destination</div>
        <p><strong>Total Distance: ${Math.round(bestDirect.totalDist)}m</strong></p>
      `;
      console.log('--- END CALCULATION ---');
      return;
    }

    console.log('[DEBUG] No direct route feasible, falling back to transfers...');

    // B. TRANSFER ROUTE (2 RIDES)
    let bestTransfer = null;
    let minTransferScore = Infinity;

    for (let s of startNearby) {
      for (let e of endNearby) {
        if (s.route.properties.route_id === e.route.properties.route_id) continue;

        // Use try/catch for lineIntersect parsing
        let intersections = { features: [] };
        try {
          intersections = turf.lineIntersect(s.route, e.route);
        } catch (err) {
          console.error(`[ERROR] lineIntersect failed for ${s.route.properties.route_name} and ${e.route.properties.route_name}:`, err);
        }

        if (intersections.features.length > 0) {
          console.log(`[DEBUG] Valid intersection found between ${s.route.properties.route_name} and ${e.route.properties.route_name}`);

          for (let intersection of intersections.features) {
            let slice1, slice2;
            try {
              const snap1 = turf.nearestPointOnLine(s.route, intersection);
              const snap2 = turf.nearestPointOnLine(e.route, intersection);
              slice1 = turf.lineSlice(s.nearestPoint, snap1, s.route);
              slice2 = turf.lineSlice(snap2, e.nearestPoint, e.route);
            } catch(err) {
               console.error('[ERROR] lineSlice failed on intersection transfer', err);
               continue;
            }

            const ride1Dist = turf.length(slice1, { units: 'kilometers' }) * 1000;
            const ride2Dist = turf.length(slice2, { units: 'kilometers' }) * 1000;

            // Prevent backward tracking loops
            if (ride1Dist < 50 || ride2Dist < 50) continue;

            const totalDist = s.distance + ride1Dist + ride2Dist + e.distance;
            if (totalDist < minTransferScore) {
              minTransferScore = totalDist;
              bestTransfer = { s, e, slice1, slice2, ride1Dist, ride2Dist, totalDist };
            }
          }
        }
      }
    }

    if (bestTransfer) {
      console.log(`[SUCCESS] Transfer route found: ${bestTransfer.s.route.properties.route_name} -> ${bestTransfer.e.route.properties.route_name}`);

      const c1 = bestTransfer.slice1.geometry.coordinates.map(c => [c[1], c[0]]);
      const c2 = bestTransfer.slice2.geometry.coordinates.map(c => [c[1], c[0]]);
      L.polyline(c1, { color: '#000000', weight: 6 }).addTo(drawnLines);
      L.polyline(c2, { color: '#555555', weight: 6 }).addTo(drawnLines);

      resultsDiv.innerHTML = `
        <h3>Transfer Route (2 Rides)</h3>
        <div class="step">🚶 Walk ${Math.round(bestTransfer.s.distance)}m to ${bestTransfer.s.route.properties.route_name}</div>
        <div class="step" style="border-left: 4px solid ${bestTransfer.s.route.properties.color}">🚙 Ride ${Math.round(bestTransfer.ride1Dist)}m on ${bestTransfer.s.route.properties.route_name}</div>
        <div class="step">🔄 Transfer to ${bestTransfer.e.route.properties.route_name}</div>
        <div class="step" style="border-left: 4px solid ${bestTransfer.e.route.properties.color}">🚙 Ride ${Math.round(bestTransfer.ride2Dist)}m on ${bestTransfer.e.route.properties.route_name}</div>
        <div class="step">🚶 Walk ${Math.round(bestTransfer.e.distance)}m to Destination</div>
        <p><strong>Total Distance: ${Math.round(bestTransfer.totalDist)}m</strong></p>
      `;
      console.log('--- END CALCULATION ---');
      return;
    }

    console.log('[DEBUG] No valid transfer route could be constructed.');
    resultsDiv.innerHTML = '<p style="color:#d97706;">No route found. Try moving the markers closer to the dashed lines or increasing the Max Walking Distance.</p>';
    console.log('--- END CALCULATION ---');

  } catch (err) {
    console.error('CRITICAL ENGINE ABORT in calculateRoute:', err);
    resultsDiv.innerHTML = `<p style="color:red;">Error calculating route: ${err.message}</p>`;
  }
}

// Start application
init();
