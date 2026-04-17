import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
  
  await page.goto('http://localhost:5003/', { waitUntil: 'networkidle0' });
  
  const content = await page.$eval('#root', el => el.innerHTML).catch(e => "Error getting #root HTML: " + e.message);
  console.log('--- ROOT CONTENT ---');
  console.log(content);
  
  await browser.close();
})();
