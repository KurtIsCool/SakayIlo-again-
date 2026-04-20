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

// Re-running the scenario where transfer failed earlier:
// The problem is that turf.lineIntersect returns a point.
// turf.lineSlice expects points ON the line. Because of floating point, the intersect point might slightly deviate from the line string segments.
// The fix is simply to use turf.nearestPointOnLine(s.route, intersection) and turf.nearestPointOnLine(e.route, intersection).

const startPt = turf.point([122.5644, 10.6974]); // On City Proper (Intersect hub)
const endPt = turf.point([122.5680, 10.6920]);   // Ortiz

const startNearby = findNearbyRoutes(startPt, mockRoutesDB, maxWalk);
const endNearby = findNearbyRoutes(endPt, mockRoutesDB, maxWalk);

let bestTransfer = null;
let minDistance = Infinity;

for (let s of startNearby) {
  for (let e of endNearby) {
    if (s.route.properties.id === e.route.properties.id) continue;

    let intersections = { features: [] };
    try {
      intersections = turf.lineIntersect(s.route, e.route);
    } catch (err) {
      console.error(`[ERROR] lineIntersect failed:`, err);
    }

    if (intersections.features.length > 0) {
      for (let intersection of intersections.features) {
        try {
          const minP1 = turf.nearestPointOnLine(s.route, intersection);
          const minP2 = turf.nearestPointOnLine(e.route, intersection);

          const slice1 = turf.lineSlice(s.nearestPoint, minP1, s.route);
          const slice2 = turf.lineSlice(minP2, e.nearestPoint, e.route);

          const ride1Dist = turf.length(slice1, { units: 'kilometers' }) * 1000;
          const ride2Dist = turf.length(slice2, { units: 'kilometers' }) * 1000;

          // Distance between minP1 and minP2 is the "gap"
          const gapDist = turf.distance(minP1, minP2, { units: 'kilometers' }) * 1000;

          if (ride1Dist < 50 || ride2Dist < 50) continue;

          const totalDist = s.distance + ride1Dist + gapDist + ride2Dist + e.distance;
          if (totalDist < minDistance) {
            minDistance = totalDist;
            bestTransfer = { s, e, slice1, slice2, ride1Dist, ride2Dist, gapDist, totalDist };
          }
        } catch(err) {
           console.error('[ERROR] transfer calculation failed', err);
        }
      }
    }
  }
}

if (bestTransfer) {
    console.log("BEST:", bestTransfer.s.route.properties.name, "->", bestTransfer.e.route.properties.name, "Score:", minDistance);
} else {
    console.log("NO TRANSFER");
}
