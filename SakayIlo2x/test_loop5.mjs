import * as turf from '@turf/turf';

function getLineSlice(startPt, endPt, line) {
  try {
    const startSnapped = turf.nearestPointOnLine(line, startPt);
    const endSnapped = turf.nearestPointOnLine(line, endPt);

    const coords = line.geometry.coordinates;
    const isLoop = coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1];

    const startLoc = startSnapped.properties.location;
    const endLoc = endSnapped.properties.location;

    if (!isLoop) {
      if (startLoc > endLoc) return null;
      return turf.lineSlice(startSnapped, endSnapped, line);
    }

    // It's a loop. Calculate both directions.
    const slice1 = turf.lineSlice(startSnapped, endSnapped, line);
    let dist1 = turf.length(slice1, { units: 'kilometers' });

    const firstPt = turf.point(coords[0]);
    const lastPt = turf.point(coords[coords.length - 1]);

    let wrapSliceCoords = [];
    if (startLoc <= endLoc) {
        const sliceToStart = turf.lineSlice(firstPt, startSnapped, line);
        const sliceToEnd = turf.lineSlice(endSnapped, lastPt, line);

        let c1 = sliceToStart.geometry.coordinates.slice().reverse();
        let c2 = sliceToEnd.geometry.coordinates.slice().reverse();

        wrapSliceCoords = [...c1, ...c2.slice(1)];
    } else {
        const sliceToStart = turf.lineSlice(startSnapped, lastPt, line);
        const sliceToEnd = turf.lineSlice(firstPt, endSnapped, line);

        let c1 = sliceToStart.geometry.coordinates;
        let c2 = sliceToEnd.geometry.coordinates;

        wrapSliceCoords = [...c1, ...c2.slice(1)];
    }

    const wrapSlice = turf.lineString(wrapSliceCoords);
    const dist2 = turf.length(wrapSlice, { units: 'kilometers' });

    // IF we are forced to go the wrap way because of directionality (if start > end, we MUST wrap for one-way), we should return wrapSlice.
    // BUT the task says "calculates both the forward and "wrap-around" distance between points and always returns the shortest path"
    // Wait, are jeepneys 2-way loops?
    // If it's a loop, it just goes round and round. So you can't go backwards.
    // BUT maybe Iloilo loops go round in one direction, so "shortest path" implies maybe they're two way?
    // "Rewrite the direct route logic so that if a route is a loop, it calculates both the forward and "wrap-around" distance between points and always returns the shortest path."
    // Yes, this means always return the shortest path.

    if (dist2 < dist1) {
        return wrapSlice;
    } else {
        return slice1;
    }

  } catch (error) {
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

// Let's test with distance
const startPt = turf.point([0.1, 0]); // close to start
const endPt = turf.point([0, 0.1]); // close to end

console.log('Shortest path 1:', JSON.stringify(getLineSlice(startPt, endPt, line).geometry.coordinates));
