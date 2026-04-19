import * as turf from '@turf/turf';

function getShortestPath(startPt, endPt, line) {
  try {
    const startSnapped = turf.nearestPointOnLine(line, startPt);
    const endSnapped = turf.nearestPointOnLine(line, endPt);

    // Check if the line is a loop (start and end points are the same)
    const coords = line.geometry.coordinates;
    const isLoop = coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1];

    const slice1 = turf.lineSlice(startSnapped, endSnapped, line);
    let dist1 = turf.length(slice1, { units: 'kilometers' });

    if (!isLoop) {
      return slice1;
    }

    // For loops, calculate the wrap-around distance
    const firstPt = turf.point(coords[0]);
    const lastPt = turf.point(coords[coords.length - 1]);

    // We get the distance from start to end in the *other* direction
    // This is basically distance from start to one end of the line + distance from other end to the end point
    // Since it's a loop, firstPt and lastPt are the same location physically

    // Depending on ordering, turf.lineSlice will go forward.
    // If start is before end, slice1 goes start -> end. The other way is start -> first, last -> end.

    const startLoc = startSnapped.properties.location;
    const endLoc = endSnapped.properties.location;

    let part1, part2;

    if (startLoc <= endLoc) {
        part1 = turf.lineSlice(firstPt, startSnapped, line);
        part2 = turf.lineSlice(endSnapped, lastPt, line);
    } else {
        part1 = turf.lineSlice(endSnapped, startSnapped, line); // Actually this is the slice1 from above
        // The other way around the loop
        part2 = null; // wait
    }

    // Actually, a simpler way is just to create the two slices and combine them
    let wrapSliceCoords = [];
    if (startLoc <= endLoc) {
        // Go backwards from start to beginning, then jump to end and go backwards to endPt?
        // Let's just create the geometry
        const sliceToStart = turf.lineSlice(firstPt, startSnapped, line);
        const sliceToEnd = turf.lineSlice(endSnapped, lastPt, line);

        let c1 = sliceToStart.geometry.coordinates.slice().reverse(); // start -> first
        let c2 = sliceToEnd.geometry.coordinates.slice().reverse(); // last -> end

        // Since first == last, c1 ends at first, c2 starts at last
        wrapSliceCoords = [...c1, ...c2.slice(1)];
    } else {
        // start is after end. slice1 went end -> start? No, lineSlice(start, end) goes start -> end along the line?
        // Wait, lineSlice always returns the slice *between* the two points, order doesn't matter, it follows the line's direction.
        const sliceToStart = turf.lineSlice(startSnapped, lastPt, line);
        const sliceToEnd = turf.lineSlice(firstPt, endSnapped, line);

        let c1 = sliceToStart.geometry.coordinates; // start -> last
        let c2 = sliceToEnd.geometry.coordinates; // first -> end

        wrapSliceCoords = [...c1, ...c2.slice(1)];
    }

    const wrapSlice = turf.lineString(wrapSliceCoords);
    const dist2 = turf.length(wrapSlice, { units: 'kilometers' });

    console.log("dist1:", dist1, "dist2:", dist2);

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

// Point at 0.5, 0
const startPt = turf.point([0.5, 0]);

// Point at 0, 0.5
const endPt = turf.point([0, 0.5]);

console.log('Shortest path:', JSON.stringify(getShortestPath(startPt, endPt, line).geometry.coordinates));
