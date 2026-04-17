import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
  
  const fileUrl = 'file:///' + path.resolve('test_live_js.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  const content = await page.$eval('#root', el => el.innerHTML).catch(e => "Error getting #root HTML: " + e.message);
  console.log('--- ROOT CONTENT ---');
  console.log(content);
  
  await browser.close();
})();
