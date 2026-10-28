/**
 * FixIt Now - Visual Results & Screen Capture Automation
 * Launches headless Microsoft Edge via puppeteer-core, navigates all main screens,
 * seeds localStorage sessions to display full authenticated views, and saves screenshots to results/.
 * Also fetches live API responses and writes them as JSON artifacts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
import pg from 'pg';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const resultsDir = path.resolve(projectRoot, 'results');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Load server env
dotenv.config({ path: path.resolve(projectRoot, 'server/.env') });

import { generateToken } from '../server/src/services/token.service.js';
import { createPaymentAttempt } from '../server/src/services/payment.service.js';

// Setup database connection to fetch real seed user IDs
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getSeedUsers() {
  const custRes = await pool.query('SELECT id, name, email, phone, address FROM customers ORDER BY id ASC LIMIT 1');
  const partRes = await pool.query('SELECT id, name, email, phone, service_id, vehicle_type, kyc_status, online FROM partners WHERE kyc_status = \'verified\' ORDER BY id ASC LIMIT 1');
  const admRes = await pool.query('SELECT id, email, name FROM admins ORDER BY id ASC LIMIT 1');

  const customer = custRes.rows[0] || { id: 1, name: 'Ananya Sharma', email: 'ananya@gmail.com', role: 'customer' };
  customer.role = 'customer';
  const partner = partRes.rows[0] || { id: 1, name: 'Ramesh Kumar', email: 'ramesh.electrician@gmail.com', role: 'partner', kyc_status: 'verified', online: true };
  partner.role = 'partner';
  const admin = admRes.rows[0] || { id: 1, email: 'admin@fixitnow.com', role: 'admin' };
  admin.role = 'admin';

  return { customer, partner, admin };
}

async function captureAll() {
  console.log('Connecting to database to extract active user credentials...');
  const { customer, partner, admin } = await getSeedUsers();

  const customerToken = generateToken({ id: customer.id, email: customer.email, role: 'customer', name: customer.name });
  const partnerToken = generateToken({ id: partner.id, email: partner.email, role: 'partner', name: partner.name, session_version: 0 });
  const adminToken = generateToken({ id: admin.id, email: admin.email, role: 'admin', name: 'Super Admin' });

  console.log(`Generated tokens for Customer (${customer.email}), Partner (${partner.email}), Admin (${admin.email})`);

  // Create an active QR payment attempt to capture the /pay/:token screen
  let payToken = 'demo-pay-token';
  try {
    const attempt = await createPaymentAttempt(partner.id, 1);
    if (attempt && attempt.token) {
      payToken = attempt.token;
    }
  } catch (err) {
    console.warn('[Payment Attempt Generation Warning]:', err.message);
  }

  // Launch headless browser
  console.log('Launching headless Microsoft Edge browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850, deviceScaleFactor: 1.5 });

  const screens = [
    {
      id: '01_landing_page',
      url: 'http://localhost:5173/#/',
      caption: 'Landing page showcasing marketplace hero banner, trade categories, pricing breakdown, and role entry points.',
      async setup(p) {
        await p.evaluate(() => localStorage.clear());
      },
    },
    {
      id: '02_customer_auth',
      url: 'http://localhost:5173/#/customer/login',
      caption: 'Customer authentication interface featuring email/password sign-in and new account registration with terms acceptance.',
      async setup(p) {
        await p.evaluate(() => localStorage.clear());
      },
    },
    {
      id: '03_customer_dashboard',
      url: 'http://localhost:5173/#/customer/dashboard',
      caption: 'Customer portal dashboard displaying active orders, 8 service category cards, and instant booking shortcuts.',
      async setup(p) {
        await p.evaluate((tok, usr) => {
          localStorage.setItem('fixit_token', tok);
          localStorage.setItem('fixit_role', 'customer');
          localStorage.setItem('fixit_user', JSON.stringify(usr));
        }, customerToken, customer);
      },
    },
    {
      id: '04_create_request',
      url: 'http://localhost:5173/#/customer/new-request',
      caption: 'Service request booking form with auto-geocoded address input, issue description, and photo attachment.',
      async setup(p) {
        await p.evaluate((tok, usr) => {
          localStorage.setItem('fixit_token', tok);
          localStorage.setItem('fixit_role', 'customer');
          localStorage.setItem('fixit_user', JSON.stringify(usr));
        }, customerToken, customer);
      },
    },
    {
      id: '05_customer_live_tracking',
      url: 'http://localhost:5173/#/customer/tracking',
      caption: 'Customer live tracking view displaying interactive route tracking map, en-route telemetry, and 4-digit start OTP.',
      async setup(p) {
        await p.evaluate((tok, usr) => {
          localStorage.setItem('fixit_token', tok);
          localStorage.setItem('fixit_role', 'customer');
          localStorage.setItem('fixit_user', JSON.stringify(usr));
          localStorage.setItem('fixit_active_request', JSON.stringify({
            id: 1,
            service_id: 1,
            service_name: 'Plumbing Service',
            status: 'partner_on_way',
            service_otp: '4821',
            latitude: 12.9750,
            longitude: 77.6050,
            partner_name: 'Ramesh Kumar',
            partner_phone: '9876543210',
            vehicle_type: 'bike_scooter',
            route_distance_km: 1.2,
            eta_minutes: 4,
          }));
        }, customerToken, customer);
      },
    },
    {
      id: '06_customer_rate_and_pay',
      url: 'http://localhost:5173/#/customer/rate-receipt',
      caption: 'Completed order settlement interface with multi-modal payment options (Cash, UPI QR, Online) and 5-star rating feedback.',
      async setup(p) {
        await p.evaluate((tok, usr) => {
          localStorage.setItem('fixit_token', tok);
          localStorage.setItem('fixit_role', 'customer');
          localStorage.setItem('fixit_user', JSON.stringify(usr));
          localStorage.setItem('fixit_active_request', JSON.stringify({
            id: 1,
            service_name: 'Plumbing Repair',
            total_amount: 350,
            status: 'service_completed',
            partner_name: 'Ramesh Kumar',
          }));
        }, customerToken, customer);
      },
    },
    {
      id: '07_partner_auth',
      url: 'http://localhost:5173/#/partner/login',
      caption: 'Partner portal onboarding and login screen with trade selection, vehicle type registration, and credential entry.',
      async setup(p) {
        await p.evaluate(() => localStorage.clear());
      },
    },
    {
      id: '08_partner_dashboard',
      url: 'http://localhost:5173/#/partner/dashboard',
      caption: 'Partner operational dashboard showing online radar toggle switch, active subscription status bar, and earnings summary.',
      async setup(p) {
        await p.evaluate((tok, usr) => {
          localStorage.setItem('fixit_token', tok);
          localStorage.setItem('fixit_role', 'partner');
          localStorage.setItem('fixit_user', JSON.stringify(usr));
        }, partnerToken, partner);
      },
    },
    {
      id: '09_partner_plans',
      url: 'http://localhost:5173/#/partner/plans',
      caption: 'Subscription plan selection view displaying Standard, Pro, and Annual tiers with dynamic UPI QR payment modal.',
      async setup(p) {
        await p.evaluate((tok, usr) => {
          localStorage.setItem('fixit_token', tok);
          localStorage.setItem('fixit_role', 'partner');
          localStorage.setItem('fixit_user', JSON.stringify(usr));
        }, partnerToken, partner);
      },
    },
    {
      id: '10_partner_kyc_upload',
      url: 'http://localhost:5173/#/partner/kyc',
      caption: 'Partner verification view enabling secure multi-part upload of government ID (PDF), trade license, and passport photo.',
      async setup(p) {
        await p.evaluate((tok, usr) => {
          localStorage.setItem('fixit_token', tok);
          localStorage.setItem('fixit_role', 'partner');
          localStorage.setItem('fixit_user', JSON.stringify(usr));
        }, partnerToken, partner);
      },
    },
    {
      id: '11_admin_login',
      url: 'http://localhost:5173/#/admin/login',
      caption: 'Dedicated administrative login interface enforcing strict RBAC credential validation.',
      async setup(p) {
        await p.evaluate(() => localStorage.clear());
      },
    },
    {
      id: '12_admin_dashboard',
      url: 'http://localhost:5173/#/admin/dashboard',
      caption: 'High-density administrative analytics dashboard presenting revenue trends, partner fulfillment rates, and system KPIs.',
      async setup(p) {
        await p.evaluate((tok, usr) => {
          localStorage.setItem('fixit_token', tok);
          localStorage.setItem('fixit_role', 'admin');
          localStorage.setItem('fixit_user', JSON.stringify(usr));
          localStorage.setItem('fixit_admin_session', JSON.stringify(usr));
        }, adminToken, admin);
      },
    },
    {
      id: '13_admin_kyc_review',
      url: 'http://localhost:5173/#/admin/kyc',
      caption: 'Administrator KYC verification queue showing submitted partner dossiers, document preview links, and approval/rejection controls.',
      async setup(p) {
        await p.evaluate((tok, usr) => {
          localStorage.setItem('fixit_token', tok);
          localStorage.setItem('fixit_role', 'admin');
          localStorage.setItem('fixit_user', JSON.stringify(usr));
          localStorage.setItem('fixit_admin_session', JSON.stringify(usr));
        }, adminToken, admin);
      },
    },
    {
      id: '14_mobile_qr_pay_page',
      url: `http://localhost:5001/pay/${payToken}`,
      caption: 'Mobile-optimized server-rendered UPI checkout page (`/pay/:token`) served directly by Express for scanned QR codes.',
      async setup() {
        // No client localStorage needed; server-rendered HTML
      },
    },
  ];

  const captions = [];

  for (const s of screens) {
    try {
      console.log(`Navigating to ${s.id}: ${s.url}...`);
      await page.goto(s.url, { waitUntil: 'load', timeout: 15000 });
      if (s.setup) {
        await s.setup(page);
        // Reload after setting localStorage so state takes effect
        await page.goto(s.url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      }
      // Small delay for UI animations/Recharts rendering
      await new Promise((r) => setTimeout(r, 1200));

      const screenshotPath = path.resolve(resultsDir, `${s.id}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`  ✓ Captured: results/${s.id}.png`);
      captions.push({
        id: s.id,
        file: `results/${s.id}.png`,
        caption: s.caption,
        status: 'CAPTURED',
      });
    } catch (err) {
      console.error(`  ✗ Failed to capture ${s.id}:`, err.message);
      captions.push({
        id: s.id,
        file: `results/${s.id}.png`,
        caption: s.caption,
        status: 'NOT RUN: ' + err.message,
      });
    }
  }

  await browser.close();

  // Capture Live API Responses
  console.log('\nFetching real API endpoint responses...');

  const apiEndpoints = [
    {
      id: '15_api_health_response',
      url: 'http://localhost:5001/api/health',
      caption: 'Real-time health check response detailing PostgreSQL connection status, database row baseline, and server uptime.',
    },
    {
      id: '16_api_services_response',
      url: 'http://localhost:5001/api/services',
      caption: 'Active public services catalog returning verified trade categories, icons, and descriptions.',
    },
    {
      id: '17_api_plans_response',
      url: 'http://localhost:5001/api/plans',
      caption: 'Partner subscription plans API returning active pricing tiers, duration, and feature sets.',
    },
  ];

  for (const api of apiEndpoints) {
    try {
      const res = await fetch(api.url);
      const json = await res.json();
      const filePath = path.resolve(resultsDir, `${api.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
      console.log(`  ✓ Saved API response: results/${api.id}.json`);
      captions.push({
        id: api.id,
        file: `results/${api.id}.json`,
        caption: api.caption,
        status: 'FETCHED',
      });
    } catch (err) {
      console.error(`  ✗ Failed to fetch ${api.id}:`, err.message);
      captions.push({
        id: api.id,
        file: `results/${api.id}.json`,
        caption: api.caption,
        status: 'NOT RUN: ' + err.message,
      });
    }
  }

  // Save index of captions
  const captionsMarkdown = `# FixIt Now - Execution Results & Visual Proof Catalog

*Generated: ${new Date().toISOString()}*

| # | Artifact File | Status | One-Line Caption |
| :--- | :--- | :--- | :--- |
${captions.map((c, idx) => `| **${idx + 1}** | [\`${c.file}\`](file:///${path.resolve(projectRoot, c.file).replace(/\\/g, '/')}) | \`${c.status}\` | ${c.caption} |`).join('\n')}
`;

  fs.writeFileSync(path.resolve(resultsDir, 'captions.md'), captionsMarkdown, 'utf8');
  console.log('\nCaptions catalog saved to results/captions.md');

  await pool.end();
  console.log('All results captured and database connection closed cleanly.');
}

captureAll().catch((err) => {
  console.error('[Fatal Error in captureAll]:', err);
  process.exit(1);
});
