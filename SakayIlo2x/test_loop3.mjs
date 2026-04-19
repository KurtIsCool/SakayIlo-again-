import * as turf from '@turf/turf';

function getShortestPath(startPt, endPt, line) {
  try {
    const startSnapped = turf.nearestPointOnLine(line, startPt);
    const endSnapped = turf.nearestPointOnLine(line, endPt);

    const coords = line.geometry.coordinates;
    const isLoop = coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1];

    const slice1 = turf.lineSlice(startSnapped, endSnapped, line);
    let dist1 = turf.length(slice1, { units: 'kilometers' });

    if (!isLoop) {
      // For direct routes, ensure correct direction
      if (startSnapped.properties.location > endSnapped.properties.location) {
          return null; // Wrong direction
      }
      return slice1;
    }

    // For loops, we can go either way around the loop because it's a loop
    const firstPt = turf.point(coords[0]);
    const lastPt = turf.point(coords[coords.length - 1]);

    const startLoc = startSnapped.properties.location;
    const endLoc = endSnapped.properties.location;

    let wrapSliceCoords = [];
    if (startLoc <= endLoc) {
        // slice1 goes start -> end forward.
        // The wrap around goes start -> first -> last -> end (backwards in terms of coordinates)
        const sliceToStart = turf.lineSlice(firstPt, startSnapped, line);
        const sliceToEnd = turf.lineSlice(endSnapped, lastPt, line);

        let c1 = sliceToStart.geometry.coordinates.slice().reverse();
        let c2 = sliceToEnd.geometry.coordinates.slice().reverse();

        wrapSliceCoords = [...c1, ...c2.slice(1)];
    } else {
        // slice1 actually goes end -> start in coordinate order, but turf.lineSlice returns it start->end (or end->start).
        // Wait, turf.lineSlice returns coordinates from startPt to stopPt.
        // Actually, turf.lineSlice returns the slice *between* the two points.
        // Let's verify direction.

        // If startLoc > endLoc, it means we must go forward from start to last, then first to end
        const sliceToStart = turf.lineSlice(startSnapped, lastPt, line);
        const sliceToEnd = turf.lineSlice(firstPt, endSnapped, line);

        let c1 = sliceToStart.geometry.coordinates;
        let c2 = sliceToEnd.geometry.coordinates;

        wrapSliceCoords = [...c1, ...c2.slice(1)];
    }

    const wrapSlice = turf.lineString(wrapSliceCoords);
    const dist2 = turf.length(wrapSlice, { units: 'kilometers' });

    if (startLoc > endLoc) {
        // If startLoc > endLoc, the direct slice1 is actually going backwards.
        // For one-way loops, we MUST go forward: start -> last -> first -> end.
        // So dist2 is the ONLY valid path!
        return wrapSlice;
    }

    // If it's a loop, but maybe two-way, or just shortest distance?
    // User says "rewrite the direct route logic so that if a route is a loop, it calculates both the forward and 'wrap-around' distance between points and always returns the shortest path."
    // This implies loops can be traveled in either direction!

    if (dist2 < dist1) {
        return wrapSlice;
    } else {
        return slice1;
    }

  } catch (err) {
      console.log(err);
      return null;
  }
}

const line = turf.lineString([
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0] // loop
]);

const startPt = turf.point([0.5, 0]); // startLoc < endLoc
const endPt = turf.point([0, 0.5]);

console.log('Shortest path 1:', JSON.stringify(getShortestPath(startPt, endPt, line).geometry.coordinates));

// Now start is AFTER end
const startPt2 = turf.point([0, 0.5]);
const endPt2 = turf.point([0.5, 0]);

console.log('Shortest path 2:', JSON.stringify(getShortestPath(startPt2, endPt2, line).geometry.coordinates));
