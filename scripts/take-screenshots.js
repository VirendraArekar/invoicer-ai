const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('../backend/node_modules/ws');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../docs/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (c) => (respData += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(respData));
          } catch (e) {
            resolve(respData);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
  }

  init() {
    return new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(new Error(data.error.message));
          else cb.resolve(data.result);
        }
      });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const callId = ++this.id;
      this.callbacks.set(callId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: callId, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  console.log('1. Logging in to obtain demo JWT token...');
  const authRes = await httpPost('http://localhost:5173/api/auth/login', {
    email: 'demo@invoicerai.com',
    password: 'password123',
  });

  const token = authRes?.data?.accessToken;
  const user = authRes?.data?.user;
  if (!token) {
    throw new Error('Failed to login: ' + JSON.stringify(authRes));
  }
  console.log(`   Logged in successfully as: ${user.name} (${user.email})`);

  console.log('2. Launching Headless Chrome on debug port 9222...');
  const chromeProcess = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--window-size=1440,960',
      '--disable-gpu',
      '--no-sandbox',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let targets = null;
  for (let i = 0; i < 30; i++) {
    try {
      targets = await httpGet('http://127.0.0.1:9222/json');
      if (targets && targets.length > 0) break;
    } catch {
      await delay(300);
    }
  }

  if (!targets || !targets[0]) {
    chromeProcess.kill();
    throw new Error('Chrome failed to start or debug endpoint unreachable');
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  console.log(`3. Connecting to CDP via WebSocket: ${pageTarget.webSocketDebuggerUrl}`);
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.init();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 960,
    deviceScaleFactor: 2,
    mobile: false,
  });

  // Capture Landing Page
  console.log('Capturing: Landing Page (Light Mode)...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
  await delay(2500);
  await cdp.send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('invoicer_theme', 'light');
      document.documentElement.classList.remove('dark');
    `,
  });
  await delay(800);
  let shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, '01-landing-page.png'), Buffer.from(shot.data, 'base64'));

  // Capture Login
  console.log('Capturing: Login Page...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/login' });
  await delay(1500);
  await cdp.send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('invoicer_theme', 'light');
      document.documentElement.classList.remove('dark');
    `,
  });
  await delay(500);
  shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, '02-login.png'), Buffer.from(shot.data, 'base64'));

  // Capture Register
  console.log('Capturing: Register Page...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/register' });
  await delay(1500);
  await cdp.send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('invoicer_theme', 'light');
      document.documentElement.classList.remove('dark');
    `,
  });
  await delay(500);
  shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, '03-register.png'), Buffer.from(shot.data, 'base64'));

  // Inject authenticated state
  console.log('Injecting auth credentials into localStorage...');
  await cdp.send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('invoicer_token', ${JSON.stringify(token)});
      localStorage.setItem('invoicer_user', ${JSON.stringify(JSON.stringify(user))});
      localStorage.setItem('invoicer_theme', 'light');
      document.documentElement.classList.remove('dark');
    `,
  });

  const appRoutes = [
    { url: 'http://localhost:5173/dashboard', filename: '04-dashboard.png', title: 'Dashboard' },
    { url: 'http://localhost:5173/invoices', filename: '05-invoices.png', title: 'Invoices List' },
    { url: 'http://localhost:5173/invoices/new', filename: '06-invoice-new.png', title: 'Invoice Editor' },
    { url: 'http://localhost:5173/invoices/inv_01', filename: '07-invoice-detail.png', title: 'Invoice Detail & PDF' },
    { url: 'http://localhost:5173/clients', filename: '08-clients.png', title: 'Client Directory' },
    { url: 'http://localhost:5173/payments', filename: '09-payments.png', title: 'Payment Ledger' },
    { url: 'http://localhost:5173/expenses', filename: '10-expenses.png', title: 'Expenses & Receipts' },
    { url: 'http://localhost:5173/catalog', filename: '11-catalog.png', title: 'Products & Services Catalog' },
    { url: 'http://localhost:5173/reports', filename: '12-reports.png', title: 'Financial Reports & P&L' },
    { url: 'http://localhost:5173/ai', filename: '13-ai-copilot.png', title: 'Google Gemini AI Suite' },
    { url: 'http://localhost:5173/settings', filename: '14-settings.png', title: 'Workspace Settings' },
  ];

  for (const route of appRoutes) {
    console.log(`Capturing: ${route.title} (${route.url})...`);
    await cdp.send('Page.navigate', { url: route.url });
    await delay(2000);
    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('invoicer_theme', 'light');
        document.documentElement.classList.remove('dark');
      `,
    });
    await delay(600);
    const s = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, route.filename), Buffer.from(s.data, 'base64'));
    console.log(`   Saved ${route.filename} (${(s.data.length * 0.75 / 1024).toFixed(1)} KB)`);
  }

  cdp.close();
  chromeProcess.kill();
  console.log('All screenshots captured successfully in docs/screenshots!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
