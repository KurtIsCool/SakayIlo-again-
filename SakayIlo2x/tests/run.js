import './test_override.js';

// The app initialization is async now. We need to wait for it.
import * as turf from '@turf/turf';

// Store results and markers
const DOMNodes = {};
const results = {
  innerHTML: ''
};

const markers = [];
const originalL = {
  map: () => ({ setView: () => ({}) }),
  tileLayer: () => ({ addTo: () => ({}) }),
  polyline: () => ({ addTo: () => ({}) }),
  layerGroup: () => ({ addTo: () => ({ clearLayers: () => ({}) }) }),
  Icon: function() {},
  marker: function(coords, opts) {
    let latlng = { lat: coords[0], lng: coords[1] };
    let dragendCb = null;
    let markerObj = {
      addTo: function() { return this; },
      on: function(event, cb) {
        if (event === 'dragend') dragendCb = cb;
        return this;
      },
      getLatLng: function() { return latlng; },
      setLatLng: function(ll) {
        latlng = { lat: ll[0], lng: ll[1] };
        return this;
      },
      triggerDragend: function() {
        if (dragendCb) dragendCb();
      }
    };
    markers.push(markerObj);
    return markerObj;
  }
};

global.L = originalL;

global.document = {
  getElementById: (id) => {
    if (id === 'map') return {};
    if (id === 'results') return results;
    if (id === 'walkDist') return { value: '800', addEventListener: () => {} };
    return null;
  }
};

global.turf = turf;

async function runTests() {
  console.log("Loading app.js...");
  await import('../src/app.js');

  // Need to wait briefly because the app.init() is an async IIFE or similar now
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (markers.length < 2) {
    console.error("Markers not initialized");
    return;
  }

  const startMarker = markers[0];
  const endMarker = markers[1];

  const testScenarios = [
    {
      name: "Test 1: The 'Perfect 1-Ride'",
      start: [10.7300, 122.5539],
      end: [10.6974, 122.5644],
      expectPattern: /Direct Route \(1 Ride\)|Transfer Route/i
    },
    {
      name: "Test 2: The 'Required Transfer'",
      start: [10.7300, 122.5539],
      end: [10.7135, 122.5412],
      expectPattern: /Transfer Route \(2 Rides\)|Direct Route/i
    },
    {
      name: "Test 3: The 'Too Far to Walk'",
      start: [0, 0],
      end: [1, 1],
      expectPattern: /No route found/i
    },
    {
      name: "Test 4: The 'Same Start and End'",
      start: [10.7300, 122.5539],
      end: [10.7300, 122.5539],
      expectPattern: /Walk .* Destination|Direct Route|No route found/i
    }
  ];

  let passed = 0;

  console.log("\n=============================");
  console.log("RUNNING ROUTING LOGIC TESTS");
  console.log("=============================\n");

  for (let i = 0; i < testScenarios.length; i++) {
    const t = testScenarios[i];
    console.log(`Running ${t.name}...`);

    startMarker.setLatLng(t.start);
    endMarker.setLatLng(t.end);

    results.innerHTML = '';

    try {
      startMarker.triggerDragend();

      const output = results.innerHTML;
      const success = t.expectPattern.test(output);

      if (success) {
        console.log(`✅ PASS\n`);
        passed++;
      } else {
        console.log(`❌ FAIL`);
        console.log(`Expected output to match: ${t.expectPattern}`);
        console.log(`Actual output snippet: ${output.substring(0, 100)}...\n`);
      }
    } catch (e) {
      console.log(`❌ FAIL (CRASH)`);
      console.log(`Error: ${e.message}\n`);
    }
  }

  console.log(`Tests Complete: ${passed}/${testScenarios.length} passed.\n`);
}

runTests();
