import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Navigate to the app
  await page.goto('http://localhost:3000/');

  // Click on the origin "Choose on map" button
  // It is the second button in the origin input container
  await page.waitForSelector('button[title="Choose on map"]');
  const mapPinButtons = await page.$$('button[title="Choose on map"]');
  await mapPinButtons[0].click();

  // Wait for the modal to appear
  await page.waitForSelector('text=Select Origin on Map');

  // Wait a bit for map to render
  await page.waitForTimeout(2000);

  // Capture screenshot of the map modal
  await page.screenshot({ path: 'map_modal.png' });

  // Drag the marker to trigger onPositionChange
  // In React-Leaflet the marker is represented by an img inside the map container
  await page.waitForSelector('.leaflet-marker-icon');
  const marker = await page.$('.leaflet-marker-icon');
  if (marker) {
    const box = await marker.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
      await page.mouse.up();
    }
  }

  // Wait a bit
  await page.waitForTimeout(1000);

  // Capture screenshot after dragging
  await page.screenshot({ path: 'map_modal_dragged.png' });

  // Click confirm location
  await page.click('text=Confirm Location');

  // Wait for modal to close
  await page.waitForTimeout(1000);

  // Capture screenshot of the resulting bottom sheet
  await page.screenshot({ path: 'bottom_sheet_updated.png' });

  await browser.close();
})();
