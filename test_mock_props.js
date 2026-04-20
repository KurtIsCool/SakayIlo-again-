import { loadRoutes } from './SakayIlo2x/tests/mockDataLoader.js';

async function run() {
  process.chdir('SakayIlo2x');
  const data = await loadRoutes();
  console.log(data.features[0].properties);
}
run();
