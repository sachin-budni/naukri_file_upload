const { chromium } = require('playwright');

// Helper function with retry logic
async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`⚠️  Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

(async () => {
  // Run headless on CI (Jenkins sets JENKINS_HOME). Locally keep visible browser.
  const runningOnJenkins = !!process.env.JENKINS_HOME || process.env.CI === 'true';
  const browser = await chromium.launch({
    headless: runningOnJenkins, 
    slowMo: runningOnJenkins ? 0 : 100,
    args: [
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(30000); // Global timeout
  page.setDefaultNavigationTimeout(30000);

  // 1️⃣ Open Naukri
  await page.goto('https://www.naukri.com/nlogin/login', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // 2️⃣ LOGIN (use environment variables when available)
  const NAUKRI_EMAIL = process.env.NAUKRI_EMAIL || 'sachinswapna143@gmail.com';
  const NAUKRI_PASSWORD = process.env.NAUKRI_PASSWORD || 'Sapna@143';

  await retryWithBackoff(async () => {
    await page.fill('#usernameField', NAUKRI_EMAIL);
    await page.fill('#passwordField', NAUKRI_PASSWORD);
    await page.click('button[type="submit"]');
  });

  // Wait for navigation after login
  await page.waitForNavigation({ 
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  }).catch(() => console.log('Navigation completed or timed out (continuing...)'));

  // Additional wait for page stability
  await page.waitForTimeout(3000);

  // 3️⃣ Go to Profile
  await page.goto('https://www.naukri.com/mnjuser/profile', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // 4️⃣ Upload Resume File
  await retryWithBackoff(async () => {
    try {
      await page.click('text=Update resume', { timeout: 10000 });
    } catch {
      // Fallback selector if text selector fails
      await page.click('[class*="update"][class*="resume"]', { timeout: 10000 });
    }
  });

  const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 10000 });
  
  await retryWithBackoff(async () => {
    await fileInput.setInputFiles('C:/Users/SachinBudini/Pictures/sachin_budni_updated.pdf');
  });

  // Wait for upload to complete
  await page.waitForTimeout(3000);

  console.log('📄 Resume uploaded successfully');

  await page.waitForTimeout(3000);
  await browser.close();
})().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
