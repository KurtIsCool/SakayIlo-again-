const fs = require('fs');

console.log("Checking for findTransferRoutes in routingEngine.ts...");

const content = fs.readFileSync('SakayIlo2x/src/lib/routingEngine.ts', 'utf8');

if (content.includes('gap <= 50')) {
    console.log("findTransferRoutes ALREADY HAS the 50m proximity buffer failsafe.");
} else {
    console.log("findTransferRoutes is missing the 50m proximity buffer failsafe.");
}
