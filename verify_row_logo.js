const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900 });
  await page.goto('https://antique-home-static.vercel.app/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => localStorage.setItem('ah_cart', JSON.stringify([{ id: 'vintage-piece-of-murano', name: 'Test', price: 6500, qty: 1, image: '' }])));
  await page.goto('https://antique-home-static.vercel.app/checkout.html', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 900));
  const el = await page.$('.chk__payList');
  await el.screenshot({ path: 'v_payrow_logo.png' });
  await browser.close();
})();
