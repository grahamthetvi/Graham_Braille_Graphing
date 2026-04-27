const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', error => {
    console.log(`PAGE ERROR MSG: ${error.message}`);
    console.log(`PAGE ERROR STACK: ${error.stack}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE LOG ERROR: ${msg.text()}`);
    }
  });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);
  await browser.close();
})();
