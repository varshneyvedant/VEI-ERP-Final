const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'site_showcase');
const ASSETS_DIR = path.join(OUTPUT_DIR, 'brand_assets');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');

async function main() {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const publicDir = path.join(__dirname, '..', 'public');
  const filesToCopy = ['logo.png', 'logo.jpg', 'favicon.ico'];
  for (const f of filesToCopy) {
    const src = path.join(publicDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(ASSETS_DIR, f));
      console.log('✓ Copied brand asset: ' + f);
    }
  }

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const launchOptions = {
    headless: 'new',
    executablePath: fs.existsSync(edgePath) ? edgePath : undefined,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1.25 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  };

  console.log('🚀 Launching browser to capture screenshots...');
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  const routes = [
    { url: 'http://localhost:3000/login', name: '01_Login_Zero_Trust_Portal.png' },
    { url: 'http://localhost:3000/owner/dashboard', name: '02_Owner_Executive_Dashboard.png' },
    { url: 'http://localhost:3000/manager/dashboard', name: '03_Manager_Operations_Dashboard.png' },
    { url: 'http://localhost:3000/manager/sales', name: '04_Sales_Dispatch_Terminal.png' },
    { url: 'http://localhost:3000/manager/sauda', name: '05_Sauda_Booking_Contracts.png' },
    { url: 'http://localhost:3000/manager/production', name: '06_Copper_Wire_Production.png' },
    { url: 'http://localhost:3000/manager/purchase', name: '07_Raw_Copper_Rod_Purchase.png' },
    { url: 'http://localhost:3000/manager/payments', name: '08_Payment_Audit_Ledger.png' },
    { url: 'http://localhost:3000/manager/scrap', name: '09_Scrap_Inventory_and_Sales.png' },
    { url: 'http://localhost:3000/owner/journals', name: '10_Double_Entry_General_Ledger.png' },
    { url: 'http://localhost:3000/owner/financials', name: '11_Balance_Sheet_and_Financials.png' },
    { url: 'http://localhost:3000/owner/inventory', name: '12_Copper_Batch_Inventory_FIFO.png' },
    { url: 'http://localhost:3000/owner/stakeholders', name: '13_Customer_Supplier_Stakeholders.png' },
    { url: 'http://localhost:3000/owner/employees', name: '14_Employee_Payroll_and_Salaries.png' },
    { url: 'http://localhost:3000/manager/attendance', name: '15_Staff_Attendance_Register.png' },
    { url: 'http://localhost:3000/manager/advances', name: '16_Employee_Salary_Advances.png' },
    { url: 'http://localhost:3000/manager/market-price', name: '17_MCX_Copper_Market_Rates.png' },
    { url: 'http://localhost:3000/owner/period-lock', name: '18_Period_End_Monthly_Lock.png' },
    { url: 'http://localhost:3000/owner/audit', name: '19_Audit_Trail_and_Security_Logs.png' }
  ];

  console.log('📸 Capturing (1/' + routes.length + '): ' + routes[0].name);
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, routes[0].name), fullPage: true });

  console.log('🔑 Authenticating as Owner...');
  await page.type('#username', 'owner');
  await page.type('#password', 'password123');
  await page.keyboard.press('Enter');

  console.log('⏳ Waiting for authentication session...');
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  console.log('✅ Authenticated! Current URL:', page.url());

  for (let i = 1; i < routes.length; i++) {
    const item = routes[i];
    console.log('📸 Capturing (' + (i + 1) + '/' + routes.length + '): ' + item.name + ' -> ' + item.url);
    try {
      await page.goto(item.url, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.warn('⚠️ Warning: redirected to login for ' + item.url);
      }
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, item.name), fullPage: true });
    } catch (err) {
      console.error('Failed to capture ' + item.url + ': ' + err.message);
    }
  }

  await browser.close();
  console.log('\n✨ All ' + routes.length + ' screenshots captured successfully in site_showcase/screenshots/!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
