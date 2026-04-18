import { mockRoutesDB } from './src/mockData.js';
import * as turf from '@turf/turf';

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
  const maxWalk = 800;

  const startLatLng = { lat: 10.722, lng: 122.556 };
  const endLatLng = { lat: 10.6974, lng: 122.5644 };

  try {
    const startPt = turf.point([startLatLng.lng, startLatLng.lat]);
    const endPt = turf.point([endLatLng.lng, endLatLng.lat]);

    const startNearby = findNearbyRoutes(startPt, mockRoutesDB, maxWalk);
    const endNearby = findNearbyRoutes(endPt, mockRoutesDB, maxWalk);

    let bestDirect = null;
    let minDirectDist = Infinity;

    for (let s of startNearby) {
      for (let e of endNearby) {
        if (s.route.properties.id === e.route.properties.id) {
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
            console.error(`[ERROR] Direct Route check failed for ${s.route.properties.name}:`, err);
          }
        }
      }
    }

    if (bestDirect) {
      console.log('BEST DIRECT:', bestDirect.s.route.properties.name);
      return;
    }
  } catch(e) {
  }
}
calculateRoute();
