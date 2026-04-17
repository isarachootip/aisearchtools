import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--disable-web-security', '--no-sandbox', '--disable-features=IsolateOrigins,site-per-process', '--disable-blink-features=AutomationControlled'] });
  const page = await browser.newPage();
  
  // Set user agent so we don't look like a bot
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
  
  const response = await page.goto('http://metvpngcsep6tjrdw3c110nw.187.77.147.16.sslip.io/', { waitUntil: 'networkidle0' });
  console.log('Main Page HTTP Status:', response.status());
  
  const content = await page.$eval('#root', el => el.innerHTML).catch(e => "Error getting #root HTML: " + e.message);
  console.log('--- ROOT CONTENT ---');
  console.log(content);
  
  await browser.close();
})();
