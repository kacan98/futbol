import puppeteer, {Page} from 'puppeteer'
import {createWorker} from 'tesseract.js'

const link = 'https://ticketmastersportuk.queue-it.net/?c=ticketmastersportuk&e=tottenhamhotspur&t=https%3A%2F%2Fwww.eticketing.co.uk%2Ftottenhamhotspur%2F%3Futm_source%3Dthfc%26utm_medium%3Dhome_tx_page%26utm_campaign%3Dticketing_alwayson2425_1_2024_7%26utm_content%3Dherocta%26_gl%3D1%2Atocdly%2A_ga%2AMjU3OTExODMuMTcyMTYzNjM1Mg..%2A_ga_75QKF6HR92%2AMTcyMTYzNjM1MC4xLjEuMTcyMTYzNjM1Mi4wLjAuMA..%2A_gcl_au%2ANDYzMTUxNDk2LjE3MjE2MzYzNTI.&cid=en-GB'
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