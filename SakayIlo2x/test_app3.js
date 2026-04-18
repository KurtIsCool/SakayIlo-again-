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
