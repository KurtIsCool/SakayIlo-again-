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

const firstPt = turf.point(line.geometry.coordinates[0]);
const lastPt = turf.point(line.geometry.coordinates[line.geometry.coordinates.length - 1]);

let part1 = turf.lineSlice(startSnapped, startLoc > endLoc ? lastPt : firstPt, line).geometry.coordinates;
let part2 = turf.lineSlice(startLoc > endLoc ? firstPt : lastPt, endSnapped, line).geometry.coordinates;

console.log('part1 raw:', JSON.stringify(part1));
console.log('part2 raw:', JSON.stringify(part2));

if (part1.length > 1 && turf.distance(turf.point(part1[part1.length - 1]), startSnapped) < turf.distance(turf.point(part1[0]), startSnapped)) {
    part1.reverse();
}
if (part2.length > 1 && turf.distance(turf.point(part2[0]), endSnapped) < turf.distance(turf.point(part2[part2.length - 1]), endSnapped)) {
    part2.reverse();
}

console.log('part1 fixed:', JSON.stringify(part1));
console.log('part2 fixed:', JSON.stringify(part2));
