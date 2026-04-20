import { loadRoutes } from './SakayIlo2x/tests/mockDataLoader.js';
loadRoutes().then(data => {
  console.log(data.features[0].properties);
});
