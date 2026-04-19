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
        // slice1 is start -> end (forward).
        // wrap is start -> first, then last -> end (backward).
        const sliceToStart = turf.lineSlice(firstPt, startSnapped, line);
        const sliceToEnd = turf.lineSlice(endSnapped, lastPt, line);

        let c1 = sliceToStart.geometry.coordinates.slice().reverse();
        let c2 = sliceToEnd.geometry.coordinates.slice().reverse();

        wrapSliceCoords = [...c1, ...c2.slice(1)];
    } else {
        // start is AFTER end.
        // slice1 is end -> start (backward).
        // wrap is start -> last, then first -> end (forward).
        const sliceToStart = turf.lineSlice(startSnapped, lastPt, line);
        const sliceToEnd = turf.lineSlice(firstPt, endSnapped, line);

        let c1 = sliceToStart.geometry.coordinates;
        let c2 = sliceToEnd.geometry.coordinates;

        wrapSliceCoords = [...c1, ...c2.slice(1)];
    }

    const wrapSlice = turf.lineString(wrapSliceCoords);
    const dist2 = turf.length(wrapSlice, { units: 'kilometers' });

    // The problem says calculate both forward and wrap-around and return the shortest path.
    if (dist2 < dist1) {
        return wrapSlice;
    } else {
        // Wait, if it's a loop and slice1 is backward, should it reverse it?
        // Let's just return slice1
        // turf.lineSlice always returns the coordinates from startPt to stopPt in the direction of the line.
        // Actually, if we pass (start, end) it will just slice it, it might reverse it.
        // We just return the line string.

        // Let's ensure the coordinates start with startSnapped and end with endSnapped.
        let result = slice1;
        const resCoords = result.geometry.coordinates;
        const startDistToFirst = turf.distance(startSnapped, turf.point(resCoords[0]));
        const startDistToLast = turf.distance(startSnapped, turf.point(resCoords[resCoords.length - 1]));

        if (startDistToLast < startDistToFirst) {
            result.geometry.coordinates.reverse();
        }
        return result;
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

// start close to end (0.9 vs 0.1)
const startPt = turf.point([0.9, 0]); // startLoc = 0.9
const endPt = turf.point([0, 0.1]); // endLoc = 3.9

const res = getLineSlice(startPt, endPt, line);
console.log('Shortest path 1:', JSON.stringify(res.geometry.coordinates));

// Now start is AFTER end
const startPt2 = turf.point([0, 0.1]); // 3.9
const endPt2 = turf.point([0.9, 0]); // 0.9

const res2 = getLineSlice(startPt2, endPt2, line);
console.log('Shortest path 2:', JSON.stringify(res2.geometry.coordinates));
