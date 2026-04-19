import * as turf from '@turf/turf';

const line = turf.lineString([
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0] // loop
]);

const startPt = turf.point([0.5, 0]); // Between [0,0] and [1,0]
const endPt = turf.point([0, 0.5]);   // Between [0,1] and [0,0]

const startSnapped = turf.nearestPointOnLine(line, startPt);
const endSnapped = turf.nearestPointOnLine(line, endPt);

const startLoc = startSnapped.properties.location;
const endLoc = endSnapped.properties.location;

console.log('startLoc:', startLoc, 'endLoc:', endLoc);

const directSlice = turf.lineSlice(startSnapped, endSnapped, line);
console.log('directSlice:', JSON.stringify(directSlice.geometry.coordinates));
