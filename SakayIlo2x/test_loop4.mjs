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

const startPt = turf.point([0.5, 0]); // startLoc < endLoc
const endPt = turf.point([0, 0.5]);

console.log('Shortest path 1:', JSON.stringify(getLineSlice(startPt, endPt, line).geometry.coordinates));

// Now start is AFTER end
const startPt2 = turf.point([0, 0.5]);
const endPt2 = turf.point([0.5, 0]);

console.log('Shortest path 2:', JSON.stringify(getLineSlice(startPt2, endPt2, line).geometry.coordinates));
