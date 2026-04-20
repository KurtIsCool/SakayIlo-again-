import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { Coord } from '@turf/helpers';

export interface RouteFeature extends Feature<LineString> {
  properties: {
    id: string;
    name: string;
    color: string;
  };
}

export interface Step {
  mode: 'walk' | 'jeep' | 'transfer';
  instruction: string;
  distance: number; // in meters
  route?: string;
  color?: string;
}

export interface RouteResult {
  type: 'direct' | 'transfer';
  totalDistance: number; // meters
  estimatedTravelTime: number; // minutes
  steps: Step[];
  pathGeoJSON?: FeatureCollection<LineString>;
}

const WALKING_SPEED_KMH = 5;
const JEEPNEY_SPEED_KMH = 15;

/**
 * Helper to calculate time in minutes based on distance and speed
 */
function calculateTime(distanceMeters: number, speedKmh: number): number {
  const distanceKm = distanceMeters / 1000;
  return (distanceKm / speedKmh) * 60;
}

/**
 * Find nearby routes for a given point within a max walking distance
 */
export function findNearbyRoutes(
  point: Coord,
  routes: FeatureCollection<LineString>,
  maxWalkingDistance: number
): { route: RouteFeature; nearestPoint: Feature<Point>; distance: number }[] {
  const nearby: { route: RouteFeature; nearestPoint: Feature<Point>; distance: number }[] = [];

  turf.featureEach(routes, (route) => {
    // Snap point to route to find the nearest boarding location
    const routeLine = route as Feature<LineString>;
    const snapped = turf.nearestPointOnLine(routeLine, point);
    // Calculate actual distance from point to snapped coordinate in meters
    const dist = turf.distance(point, snapped, { units: 'kilometers' }) * 1000;

    if (dist <= maxWalkingDistance) {
      nearby.push({
        route: route as RouteFeature,
        nearestPoint: snapped,
        distance: dist,
      });
    }
  });

  return nearby;
}

/**
 * Checks if a linestring forms a loop
 */
function isLoop(line: Feature<LineString>): boolean {
  const coords = line.geometry.coordinates;
  if (coords.length < 2) return false;
  const first = coords[0];
  const last = coords[coords.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}

/**
 * Computes the shortest slice on a closed loop line string.
 * A loop offers two directions of travel. We compute both the direct "inner" slice
 * and the "wrap-around" slice, returning the shortest one.
 */
function getShortestLoopSlice(
  startSnapped: Feature<Point>,
  endSnapped: Feature<Point>,
  line: Feature<LineString>
): Feature<LineString> {
  const locStart = startSnapped.properties?.location || 0;
  const locEnd = endSnapped.properties?.location || 0;

  const innerSlice = turf.lineSlice(startSnapped, endSnapped, line);
  const innerDist = turf.length(innerSlice, { units: 'kilometers' });

  const totalLength = turf.length(line, { units: 'kilometers' });
  const wrapAroundDist = totalLength - innerDist;

  if (innerDist <= wrapAroundDist) {
    const coords = innerSlice.geometry.coordinates;
    if (locStart > locEnd) {
      coords.reverse();
    }
    return turf.lineString(coords);
  } else {
    const startCoord = line.geometry.coordinates[0];
    const endCoord = line.geometry.coordinates[line.geometry.coordinates.length - 1];
    const pStart = turf.point(startCoord);
    const pEnd = turf.point(endCoord);

    let part1, part2;
    if (locStart <= locEnd) {
      part1 = turf.lineSlice(pStart, startSnapped, line);
      part1.geometry.coordinates.reverse();

      part2 = turf.lineSlice(endSnapped, pEnd, line);
      part2.geometry.coordinates.reverse();
    } else {
      part1 = turf.lineSlice(startSnapped, pEnd, line);
      part2 = turf.lineSlice(pStart, endSnapped, line);
    }

    const mergedCoords = [...part1.geometry.coordinates];
    mergedCoords.pop();
    mergedCoords.push(...part2.geometry.coordinates);
    return turf.lineString(mergedCoords);
  }
}

/**
 * Slices a line from start point to end point
 */
function getLineSlice(
  startPt: Coord,
  endPt: Coord,
  line: Feature<LineString>
): Feature<LineString> | null {
  try {
    const startSnapped = turf.nearestPointOnLine(line, startPt as any);
    const endSnapped = turf.nearestPointOnLine(line, endPt as any);

    const locStart = startSnapped.properties.location;
    const locEnd = endSnapped.properties.location;

    if (isLoop(line)) {
      return getShortestLoopSlice(startSnapped, endSnapped, line);
    } else {
      // For linear routes, directional validation prevents backward travel
      if (locStart > locEnd) {
        return null;
      }
      return turf.lineSlice(startSnapped, endSnapped, line);
    }
  } catch (error) {
    return null;
  }
}

/**
 * Evaluates possible direct routes
 */
export function findDirectRoute(
  start: Coord,
  end: Coord,
  routes: FeatureCollection<LineString>,
  maxWalkingDistance: number
): RouteResult | null {
  const startNearby = findNearbyRoutes(start, routes, maxWalkingDistance);
  const endNearby = findNearbyRoutes(end, routes, maxWalkingDistance);

  let bestResult: RouteResult | null = null;
  let minTotalDistance = Infinity;

  // Compare all possible single-ride combinations
  for (const s of startNearby) {
    for (const e of endNearby) {
      if (s.route.properties.id === e.route.properties.id) {
        // Direct route geometry sliced specifically for this trip
        const rideSegment = getLineSlice(s.nearestPoint, e.nearestPoint, s.route);
        if (!rideSegment) continue;

        let rideDistance = 0;
        try {
          rideDistance = turf.length(rideSegment, { units: 'kilometers' }) * 1000;
        } catch (error) {
          continue;
        }

        const totalDistance = s.distance + rideDistance + e.distance;
        
        // Ensure that we don't pick routes where start and end snap to the exact same place (no ride at all)
        if (rideDistance < 100) continue;

        if (totalDistance < minTotalDistance) {
          minTotalDistance = totalDistance;

          const travelTime =
            calculateTime(s.distance, WALKING_SPEED_KMH) +
            calculateTime(rideDistance, JEEPNEY_SPEED_KMH) +
            calculateTime(e.distance, WALKING_SPEED_KMH);

          // Create line segments for walking
          const walkToJeepSegment = turf.lineString([
            (start as Feature<Point>).geometry.coordinates,
            s.nearestPoint.geometry.coordinates
          ], { mode: 'walk' });

          const rideSegFeature = turf.feature(rideSegment.geometry, {
            mode: 'jeep',
            color: s.route.properties.color
          });

          const walkToDestSegment = turf.lineString([
            e.nearestPoint.geometry.coordinates,
            (end as Feature<Point>).geometry.coordinates
          ], { mode: 'walk' });

          bestResult = {
            type: 'direct',
            totalDistance: Math.round(totalDistance),
            estimatedTravelTime: Math.round(travelTime),
            steps: [
              {
                mode: 'walk',
                instruction: `Walk to ${s.route.properties.name} route`,
                distance: Math.round(s.distance)
              },
              {
                mode: 'jeep',
                route: s.route.properties.name,
                color: s.route.properties.color,
                instruction: `Ride ${s.route.properties.name} jeepney`,
                distance: Math.round(rideDistance)
              },
              {
                mode: 'walk',
                instruction: `Walk to destination`,
                distance: Math.round(e.distance)
              }
            ],
            pathGeoJSON: turf.featureCollection([walkToJeepSegment, rideSegFeature, walkToDestSegment])
          };
        }
      }
    }
  }

  return bestResult;
}

/**
 * Detects coincident corridors by sampling points along the first route
 * and snapping to the second route. Returns the best transfer point
 * if the distance is within the max gap.
 */
function findCoincidentTransfer(
  routeA: Feature<LineString>,
  routeB: Feature<LineString>,
  maxGapMeters: number = 50
): { point: Feature<Point>; gapMeters: number } | null {
  let lengthA = 0;
  try {
    lengthA = turf.length(routeA, { units: 'kilometers' });
  } catch (error) {
    return null;
  }

  let minPointsDistance = Infinity;
  let bestTransferA: Feature<Point> | null = null;

  // Sample every 100 meters (0.1 km) for better precision in finding proximity
  for (let d = 0; d <= lengthA; d += 0.1) {
    let pt: Feature<Point>;
    try {
      pt = turf.along(routeA, d, { units: 'kilometers' });
    } catch(e) {
      continue; // skip this sample if it fails
    }

    try {
      const snapB = turf.nearestPointOnLine(routeB, pt);
      const gap = turf.distance(pt, snapB, { units: 'kilometers' }) * 1000;
      // Check if it's the best gap, and if it's within the proximity rule
      if (gap < minPointsDistance && gap <= maxGapMeters) {
        minPointsDistance = gap;
        bestTransferA = pt;
      }
    } catch(e) {
      continue;
    }
  }

  if (bestTransferA) {
    return { point: bestTransferA, gapMeters: minPointsDistance };
  }
  return null;
}

/**
 * Evaluates possible 1-transfer routes
 * Uses proximity-based transfers instead of strict intersection.
 */
export function findTransferRoutes(
  start: Coord,
  end: Coord,
  routes: FeatureCollection<LineString>,
  maxWalkingDistance: number
): RouteResult | null {
  const startNearby = findNearbyRoutes(start, routes, maxWalkingDistance);
  const endNearby = findNearbyRoutes(end, routes, maxWalkingDistance);

  let bestResult: RouteResult | null = null;
  let minScore = Infinity; // Could be distance + transfer penalty

  for (const s of startNearby) {
    for (const e of endNearby) {
      if (s.route.properties.id === e.route.properties.id) continue; // Skip identical routes

      const transferResult = findCoincidentTransfer(
        s.route as Feature<LineString>,
        e.route as Feature<LineString>
      );

      if (transferResult) {
        const transferPt = transferResult.point;
        const walkTransferDist = transferResult.gapMeters;

        const rideSeg1 = getLineSlice(s.nearestPoint, transferPt, s.route);
        const rideSeg2 = getLineSlice(transferPt, e.nearestPoint, e.route);

        if (!rideSeg1 || !rideSeg2) continue;

        let ride1Dist = 0;
        let ride2Dist = 0;
        try {
          ride1Dist = turf.length(rideSeg1, { units: 'kilometers' }) * 1000;
          ride2Dist = turf.length(rideSeg2, { units: 'kilometers' }) * 1000;
        } catch (error) {
          continue;
        }

        // Validate that the trip is logical and doesn't back-track endlessly
        if (ride1Dist < 100 || ride2Dist < 100) continue;

        const totalDistance = s.distance + ride1Dist + walkTransferDist + ride2Dist + e.distance;

        // Heuristic score: penalize transfers (e.g. + 1000m perceived weight)
        const score = totalDistance + 1000;

        if (score < minScore) {
          minScore = score;

          const travelTime =
            calculateTime(s.distance, WALKING_SPEED_KMH) +
            calculateTime(ride1Dist, JEEPNEY_SPEED_KMH) +
            calculateTime(walkTransferDist, WALKING_SPEED_KMH) +
            5 + // 5 mins penalty for transfer waiting time
            calculateTime(ride2Dist, JEEPNEY_SPEED_KMH) +
            calculateTime(e.distance, WALKING_SPEED_KMH);

          const stepsObj: Step[] = [
            {
              mode: 'walk',
              instruction: `Walk to ${s.route.properties.name} route`,
              distance: Math.round(s.distance)
            },
            {
              mode: 'jeep',
              route: s.route.properties.name,
              color: s.route.properties.color,
              instruction: `Ride ${s.route.properties.name} jeepney`,
              distance: Math.round(ride1Dist)
            }
          ];

          if (walkTransferDist > 0) {
            stepsObj.push({
              mode: 'walk',
              instruction: `Walk to ${e.route.properties.name} transfer point`,
              distance: Math.round(walkTransferDist)
            });
          }

          stepsObj.push(
            {
              mode: 'transfer',
              instruction: `Alight and transfer to ${e.route.properties.name}`,
              distance: 0
            },
            {
              mode: 'jeep',
              route: e.route.properties.name,
              color: e.route.properties.color,
              instruction: `Ride ${e.route.properties.name} jeepney`,
              distance: Math.round(ride2Dist)
            },
            {
              mode: 'walk',
              instruction: `Walk to destination`,
              distance: Math.round(e.distance)
            }
          );

          // Create line segments for walking
          const walkToJeepSegment = turf.lineString([
            (start as Feature<Point>).geometry.coordinates,
            s.nearestPoint.geometry.coordinates
          ], { mode: 'walk' });

          const rideSeg1Feature = turf.feature(rideSeg1.geometry, {
            mode: 'jeep',
            color: s.route.properties.color
          });

          // Transfer segment (snapping point of first route to snapped point on second route)
          const snapB = turf.nearestPointOnLine(e.route as Feature<LineString>, transferPt);
          const transferWalkSegment = turf.lineString([
            transferPt.geometry.coordinates,
            snapB.geometry.coordinates
          ], { mode: 'transfer' });

          const rideSeg2Feature = turf.feature(rideSeg2.geometry, {
            mode: 'jeep',
            color: e.route.properties.color
          });

          const walkToDestSegment = turf.lineString([
            e.nearestPoint.geometry.coordinates,
            (end as Feature<Point>).geometry.coordinates
          ], { mode: 'walk' });

          bestResult = {
            type: 'transfer',
            totalDistance: Math.round(totalDistance),
            estimatedTravelTime: Math.round(travelTime),
            steps: stepsObj,
            pathGeoJSON: turf.featureCollection([
              walkToJeepSegment,
              rideSeg1Feature,
              transferWalkSegment,
              rideSeg2Feature,
              walkToDestSegment
            ])
          };
        }
      }
    }
  }
  
  return bestResult;
}

/**
 * Calculates the heuristic score for a route to compare costs.
 * Applies a 1000m transfer penalty for routes with a transfer.
 */
function calculateHeuristicCost(route: RouteResult): number {
  let score = route.totalDistance;
  if (route.type === 'transfer') {
    score += 1000;
  }
  return score;
}

/**
 * Main engine entry point to find the optimal commute
 */
export function calculateCommute(
  startLatLng: [number, number],
  endLatLng: [number, number],
  routes: FeatureCollection<LineString>,
  maxWalkingDistance: number = 800
): RouteResult[] | { error: string } | null {
  try {
    // Convert basic lat/lng to Turf Point features.
    // Note: Turf uses [longitude, latitude] internally
    const startPt = turf.point([startLatLng[1], startLatLng[0]]);
    const endPt = turf.point([endLatLng[1], endLatLng[0]]);

    const directRoute = findDirectRoute(startPt, endPt, routes, maxWalkingDistance);
    const transferRoute = findTransferRoutes(startPt, endPt, routes, maxWalkingDistance);

    const results: RouteResult[] = [];
    if (directRoute) results.push(directRoute);
    if (transferRoute) results.push(transferRoute);

    if (results.length > 0) {
      return results.sort((a, b) => calculateHeuristicCost(a) - calculateHeuristicCost(b));
    }

    return null;
  } catch (error) {
    // Catch-all for malformed GeoJSON or unpredictable Turf.js crashes
    return { error: "No route found" };
  }
}
