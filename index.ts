import puppeteer, {Page} from 'puppeteer'
import {createWorker} from 'tesseract.js'

const link = 'somelink.com'
const captchaSelector = '.captcha-code'

const tick = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fillInCaptcha = async (page: Page) => {
  await page.waitForSelector(captchaSelector)
  
  const image = await page.$(captchaSelector)
  const imageData = await image?.screenshot({encoding: 'base64'});
  
  // Convert the base64 string to a Buffer
  const rawImageData = Buffer.from(imageData!, 'base64');
  const worker = await createWorker('eng');
  
  const { data: { text } } = await worker.recognize(rawImageData);
  //sanetize, remove any text that is not a number or letter
  const sanitizedText = text.replace(/[^a-zA-Z0-9]/g, '');
  
  for (const character of sanitizedText) {
    //wait random amount of time
    await tick(Math.floor(Math.random() * 1000));
    await page.type('.botdetect-input', character);
  }
  //click .botdetect-button
  await page.click('.botdetect-button');
}

async function openWindows(urls: string[]) {
  // Create a new browser instance for each URL
  for (const url of urls) {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(url);
    //wait for the captcha to load
    let success = false;
    while (!success) {
    await fillInCaptcha(page);
    //check if there is anything in the field and if it exists then the captcha has failed
    await tick(2000);
    const captchaField = await page.$('.botdetect-input');
    if (!captchaField) {
      console.log('Captcha solved successfully')
      success = true;
    }
    //refresh the page
    await page.reload();
  }
}}

// Usage
openWindows(Array.from({length: 1}, () => link));