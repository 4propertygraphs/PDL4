const { chromium } = require('playwright');

const url = process.env.TARGET_URL;
if (!url) {
  console.error('TARGET_URL env var is required');
  process.exit(1);
}

// SELECTORS as JSON: {"price": ".price", "status": ".status", "address": ".address"}
let selectors = {};
try {
  selectors = JSON.parse(process.env.SELECTORS || '{}');
} catch (e) {
  selectors = {};
}

const defaults = {
  price: selectors.price || '.price',
  status: selectors.status || '.status',
  address: selectors.address || '.address',
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

  const extract = async (sel) => {
    try {
      const el = await page.$(sel);
      if (!el) return '';
      return (await el.textContent())?.trim() || '';
    } catch {
      return '';
    }
  };

  const price = await extract(defaults.price);
  const status = await extract(defaults.status);
  const address = await extract(defaults.address);

  await browser.close();

  const result = {
    url,
    scrapedAt: new Date().toISOString(),
    data: { price, status, address },
  };
  console.log(JSON.stringify(result));
  process.exit(0);
})().catch((err) => {
  console.error(JSON.stringify({ error: err.message || err.toString() }));
  process.exit(1);
});
