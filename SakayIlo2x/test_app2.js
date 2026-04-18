import * as turf from '@turf/turf';
import { mockRoutesDB } from './src/mockData.js';

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

const maxWalk = 800;

const startPt = turf.point([122.5644, 10.6974]); // On City Proper (Intersect hub)
const endPt = turf.point([122.5680, 10.6920]);   // Ortiz

const startNearby = findNearbyRoutes(startPt, mockRoutesDB, maxWalk);
const endNearby = findNearbyRoutes(endPt, mockRoutesDB, maxWalk);

let bestTransfer = null;
let minTransferScore = Infinity;

for (let s of startNearby) {
  for (let e of endNearby) {
    if (s.route.properties.id === e.route.properties.id) continue;

    // Use try/catch for lineIntersect parsing
    let intersections = { features: [] };
    try {
      intersections = turf.lineIntersect(s.route, e.route);
    } catch (err) {
      console.error(`[ERROR] lineIntersect failed for ${s.route.properties.name} and ${e.route.properties.name}:`, err);
    }

    if (intersections.features.length > 0) {
      console.log(`[DEBUG] Valid intersection found between ${s.route.properties.name} and ${e.route.properties.name}`);

      for (let intersection of intersections.features) {
        let slice1, slice2;
        try {
          // INTERSECTION might not be EXACTLY on the route due to floating point math
          // It needs to be snapped to the line before turf.lineSlice can use it reliably.

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

        console.log(`Ride1Dist: ${ride1Dist}, Ride2Dist: ${ride2Dist}`);

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
    console.log("BEST:", bestTransfer.s.route.properties.name, "->", bestTransfer.e.route.properties.name);
} else {
    console.log("NO TRANSFER");
}
