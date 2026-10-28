/**
 * FixIt Now - Automated SRS Functional Requirements Test Suite
 * Conforms to srs.md FR numbers, covering Positive, Negative, and Boundary conditions.
 *
 * Test Execution:
 *   node --test tests/srs_functional_requirements.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Import domain services, controllers, and middleware from server/src/
import { validatePassword, generateToken, verifyToken } from '../server/src/services/token.service.js';
import { requireRole } from '../server/src/middleware/auth.middleware.js';
import {
  calculateHaversineDistance,
  isPartnerEligible,
} from '../server/src/services/matching.service.js';
import {
  decodePolyline,
  getVehicleRoutingProfile,
  calculateEta,
} from '../server/src/services/routes.service.js';
import {
  buildUpiPaymentUri,
  handleScanToken,
} from '../server/src/services/payment.service.js';
import { rejectCustomerPartnerMutation } from '../server/src/controllers/admin.controller.js';
import { verifyOtp } from '../server/src/services/otp.service.js';

// Helper for mocking Express response objects
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

// Global results accumulator for reporting
export const testResults = [];

function recordResult(testId, req, moduleName, condition, desc, inputStr, expectedStr, actualStr, passed) {
  testResults.push({
    testId,
    requirement: req,
    module: moduleName,
    condition,
    description: desc,
    input: inputStr,
    expectedOutput: expectedStr,
    actualOutput: actualStr,
    status: passed ? 'PASSED' : 'FAILED',
  });
}

// =============================================================================
// MODULE 1: AUTHENTICATION & IDENTITY MANAGEMENT
// =============================================================================

test('TC01 - FR2 (Positive): Valid complex password accepted', () => {
  const input = 'SecurePass123!';
  const res = validatePassword(input);
  const actualStr = JSON.stringify(res);
  const expectedStr = JSON.stringify({ valid: true });

  const passed = res.valid === true;
  recordResult(
    'TC01',
    'FR2',
    'Module 1: Authentication',
    'Positive',
    'Verify that a valid complex password with letters, digits, and special characters is accepted',
    `password: "${input}"`,
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(res.valid, true);
});

test('TC02 - FR2 (Negative): Password missing special character rejected', () => {
  const input = 'NoSpecial123';
  const res = validatePassword(input);
  const actualStr = JSON.stringify(res);
  const expectedStr = 'valid: false with special character error message';

  const passed = res.valid === false && res.message.includes('special character');
  recordResult(
    'TC02',
    'FR2',
    'Module 1: Authentication',
    'Negative',
    'Verify that a password lacking any special character is rejected with a descriptive error',
    `password: "${input}"`,
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(res.valid, false);
  assert.ok(res.message.includes('special character'));
});

test('TC03 - FR2 (Boundary): Password of exactly 6 characters passes boundary', () => {
  const input = 'P@ss1a';
  const res = validatePassword(input);
  const actualStr = JSON.stringify(res);
  const expectedStr = JSON.stringify({ valid: true });

  const passed = res.valid === true;
  recordResult(
    'TC03',
    'FR2',
    'Module 1: Authentication',
    'Boundary',
    'Verify that a password of exactly 6 characters with required classes satisfies minimum length boundary',
    `password: "${input}" (length: 6)`,
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(res.valid, true);
});

test('TC04 - FR2 (Boundary / Negative): Password of 5 characters rejected', () => {
  const input = 'P@s1a';
  const res = validatePassword(input);
  const actualStr = JSON.stringify(res);
  const expectedStr = 'valid: false with at least 6 characters error message';

  const passed = res.valid === false && res.message.includes('at least 6 characters');
  recordResult(
    'TC04',
    'FR2',
    'Module 1: Authentication',
    'Boundary',
    'Verify that a password of 5 characters (below boundary threshold 6) is rejected',
    `password: "${input}" (length: 5)`,
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(res.valid, false);
  assert.ok(res.message.includes('at least 6 characters'));
});

test('TC05 - FR13 (Positive): Valid signed JWT token decoded accurately', () => {
  const payload = { id: 101, email: 'customer101@fixitnow.com', role: 'customer' };
  const token = generateToken(payload);
  const decoded = verifyToken(token);

  const actualStr = `id: ${decoded.id}, email: "${decoded.email}", role: "${decoded.role}"`;
  const expectedStr = `id: 101, email: "customer101@fixitnow.com", role: "customer"`;

  const passed = decoded.id === 101 && decoded.email === 'customer101@fixitnow.com' && decoded.role === 'customer';
  recordResult(
    'TC05',
    'FR13',
    'Module 1: Authentication',
    'Positive',
    'Verify that a validly signed JWT token is verified and decodes all user claims',
    JSON.stringify(payload),
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(decoded.id, 101);
  assert.equal(decoded.role, 'customer');
});

test('TC06 - FR13 (Negative): Corrupted JWT token throws JsonWebTokenError', () => {
  const corruptedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidPayload.invalidSignature';
  let thrownError = null;

  try {
    verifyToken(corruptedToken);
  } catch (err) {
    thrownError = err;
  }

  const actualStr = thrownError ? `${thrownError.name}: ${thrownError.message}` : 'No error thrown';
  const expectedStr = 'JsonWebTokenError thrown';

  const passed = thrownError && (thrownError.name === 'JsonWebTokenError' || thrownError.message.includes('jwt'));
  recordResult(
    'TC06',
    'FR13',
    'Module 1: Authentication',
    'Negative',
    'Verify that a corrupted or tampered JWT token string fails verification with an error',
    `token: "${corruptedToken}"`,
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(thrownError != null);
  assert.equal(thrownError.name, 'JsonWebTokenError');
});

test('TC07 - FR14 (Negative): Role mismatch returns HTTP 403 Forbidden', () => {
  const guard = requireRole('admin');
  const req = { user: { role: 'customer' } };
  const res = createMockRes();
  let nextCalled = false;

  guard(req, res, () => {
    nextCalled = true;
  });

  const actualStr = `HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`;
  const expectedStr = 'HTTP 403 Forbidden with status: "error"';

  const passed = res.statusCode === 403 && nextCalled === false && res.data?.status === 'error';
  recordResult(
    'TC07',
    'FR14',
    'Module 1: Authentication',
    'Negative',
    'Verify that customer role attempting to access admin-restricted route receives HTTP 403',
    `req.user.role: "customer", allowedRoles: ["admin"]`,
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('TC08 - FR14 (Positive): Matching role proceeds through guard', () => {
  const guard = requireRole('partner', 'admin');
  const req = { user: { role: 'partner' } };
  const res = createMockRes();
  let nextCalled = false;

  guard(req, res, () => {
    nextCalled = true;
  });

  const actualStr = `next() called: ${nextCalled}, statusCode: ${res.statusCode}`;
  const expectedStr = 'next() called: true, statusCode: 200';

  const passed = nextCalled === true && res.statusCode === 200;
  recordResult(
    'TC08',
    'FR14',
    'Module 1: Authentication',
    'Positive',
    'Verify that authorized role successfully passes through RBAC middleware guard',
    `req.user.role: "partner", allowedRoles: ["partner", "admin"]`,
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(nextCalled, true);
});

// =============================================================================
// MODULE 3: REQUEST LIFECYCLE, DISPATCH & CONCURRENCY
// =============================================================================

test('TC09 - FR28 (Positive): Haversine distance between Bengaluru coordinates', () => {
  // Indiranagar 12th Main (12.9740, 77.6350) to Defence Colony (12.9810, 77.6450)
  const d = calculateHaversineDistance(12.9740, 77.6350, 12.9810, 77.6450);
  const actualStr = `${d} km`;
  const expectedStr = '~1.33 km (1.25 km to 1.45 km)';

  const passed = d > 1.25 && d < 1.45;
  recordResult(
    'TC09',
    'FR28',
    'Module 3: Request Lifecycle',
    'Positive',
    'Verify accurate great-circle Haversine distance calculation between geographic coordinates',
    'p1: (12.9740, 77.6350), p2: (12.9810, 77.6450)',
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(passed);
});

test('TC10 - FR28 (Boundary): Identical coordinates return exactly 0.0 km', () => {
  const d = calculateHaversineDistance(12.9784, 77.6408, 12.9784, 77.6408);
  const actualStr = `${d} km`;
  const expectedStr = '0 km';

  const passed = d === 0;
  recordResult(
    'TC10',
    'FR28',
    'Module 3: Request Lifecycle',
    'Boundary',
    'Verify that identical coordinate points return exact zero distance boundary',
    'p1: (12.9784, 77.6408), p2: (12.9784, 77.6408)',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(d, 0);
});

test('TC11 - FR28 (Negative): Non-numeric coordinates throw error', () => {
  let thrownError = null;
  try {
    calculateHaversineDistance('invalid_lat', 77.6350, 12.9810, 77.6450);
  } catch (err) {
    thrownError = err;
  }

  const actualStr = thrownError ? thrownError.message : 'No error';
  const expectedStr = 'Error: "Coordinates must be valid numeric values."';

  const passed = thrownError && thrownError.message.includes('valid numeric values');
  recordResult(
    'TC11',
    'FR28',
    'Module 3: Request Lifecycle',
    'Negative',
    'Verify that non-numeric or NaN latitude/longitude throws descriptive validation error',
    'lat1: "invalid_lat", lon1: 77.6350',
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(passed);
});

// Mock base partner satisfying all criteria
const basePartner = {
  id: 1,
  name: 'Ramesh Kumar',
  online: true,
  kyc_status: 'verified',
  subscription_status: 'active',
  subscription_end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
  service_id: 1,
  has_active_job: false,
  latitude: 12.9740,
  longitude: 77.6350,
};

const customerLocation = { latitude: 12.9780, longitude: 77.6380 }; // ~0.5 km away

test('TC12 - FR29 (Positive): Fully compliant partner is marked eligible', () => {
  const eligible = isPartnerEligible(basePartner, 1, customerLocation);
  const actualStr = `isPartnerEligible: ${eligible}`;
  const expectedStr = 'isPartnerEligible: true';

  const passed = eligible === true;
  recordResult(
    'TC12',
    'FR29',
    'Module 3: Request Lifecycle',
    'Positive',
    'Verify that a partner meeting all 6 eligibility requirements within 2km is approved',
    'partner: online=true, kyc="verified", active_sub, service=1, active_jobs=0, dist=0.5km',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(eligible, true);
});

test('TC13 - FR29 (Negative): Offline partner is marked ineligible', () => {
  const offlinePartner = { ...basePartner, online: false };
  const eligible = isPartnerEligible(offlinePartner, 1, customerLocation);
  const actualStr = `isPartnerEligible: ${eligible}`;
  const expectedStr = 'isPartnerEligible: false';

  const passed = eligible === false;
  recordResult(
    'TC13',
    'FR29',
    'Module 3: Request Lifecycle',
    'Negative',
    'Verify that an offline partner (online=false) is rejected by dispatch filter',
    'partner: online=false',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(eligible, false);
});

test('TC14 - FR29 (Negative): Pending KYC partner is marked ineligible', () => {
  const kycPendingPartner = { ...basePartner, kyc_status: 'pending' };
  const eligible = isPartnerEligible(kycPendingPartner, 1, customerLocation);
  const actualStr = `isPartnerEligible: ${eligible}`;
  const expectedStr = 'isPartnerEligible: false';

  const passed = eligible === false;
  recordResult(
    'TC14',
    'FR29',
    'Module 3: Request Lifecycle',
    'Negative',
    'Verify that a partner with pending KYC verification is rejected by dispatch filter',
    'partner: kyc_status="pending"',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(eligible, false);
});

test('TC15 - FR29 (Negative): Expired subscription partner is marked ineligible', () => {
  const expiredPartner = {
    ...basePartner,
    subscription_status: 'active',
    subscription_end_date: new Date(Date.now() - 86400000).toISOString(), // expired yesterday
  };
  const eligible = isPartnerEligible(expiredPartner, 1, customerLocation);
  const actualStr = `isPartnerEligible: ${eligible}`;
  const expectedStr = 'isPartnerEligible: false';

  const passed = eligible === false;
  recordResult(
    'TC15',
    'FR29',
    'Module 3: Request Lifecycle',
    'Negative',
    'Verify that a partner with an expired subscription end date is rejected by dispatch filter',
    'partner: subscription_end_date in past',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(eligible, false);
});

test('TC16 - FR29 (Negative): Partner currently on active job is marked ineligible', () => {
  const busyPartner = { ...basePartner, has_active_job: true };
  const eligible = isPartnerEligible(busyPartner, 1, customerLocation);
  const actualStr = `isPartnerEligible: ${eligible}`;
  const expectedStr = 'isPartnerEligible: false';

  const passed = eligible === false;
  recordResult(
    'TC16',
    'FR29',
    'Module 3: Request Lifecycle',
    'Negative',
    'Verify that a partner with an ongoing active job is rejected to prevent double booking',
    'partner: has_active_job=true',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(eligible, false);
});

test('TC17 - FR29 (Boundary): Partner located at 1.99 km is eligible', () => {
  // Place partner ~1.99 km north: 1 deg lat ~ 111 km => ~0.0179 degrees
  const partner1_99km = {
    ...basePartner,
    latitude: customerLocation.latitude + 0.0179,
    longitude: customerLocation.longitude,
  };
  const dist = calculateHaversineDistance(
    partner1_99km.latitude,
    partner1_99km.longitude,
    customerLocation.latitude,
    customerLocation.longitude
  );
  const eligible = isPartnerEligible(partner1_99km, 1, customerLocation);

  const actualStr = `dist: ${dist} km, isPartnerEligible: ${eligible}`;
  const expectedStr = 'dist: ~1.99 km (<=2.0 km), isPartnerEligible: true';

  const passed = dist <= 2.0 && eligible === true;
  recordResult(
    'TC17',
    'FR29',
    'Module 3: Request Lifecycle',
    'Boundary',
    'Verify boundary condition where partner is located at 1.99 km (just inside 2.0 km radius)',
    `partner at distance: ${dist} km`,
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(passed);
});

test('TC18 - FR29 (Boundary / Negative): Partner located at 2.05 km is excluded', () => {
  // Place partner ~2.05 km away: 0.0185 deg lat
  const partner2_05km = {
    ...basePartner,
    latitude: customerLocation.latitude + 0.0185,
    longitude: customerLocation.longitude,
  };
  const dist = calculateHaversineDistance(
    partner2_05km.latitude,
    partner2_05km.longitude,
    customerLocation.latitude,
    customerLocation.longitude
  );
  const eligible = isPartnerEligible(partner2_05km, 1, customerLocation);

  const actualStr = `dist: ${dist} km, isPartnerEligible: ${eligible}`;
  const expectedStr = 'dist: >2.0 km, isPartnerEligible: false';

  const passed = dist > 2.0 && eligible === false;
  recordResult(
    'TC18',
    'FR29',
    'Module 3: Request Lifecycle',
    'Boundary',
    'Verify boundary condition where partner is located at 2.05 km (just outside 2.0 km radius)',
    `partner at distance: ${dist} km`,
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(passed);
});

test('TC19 - FR31 (Positive): Encoded polyline decoded into coordinate pairs', () => {
  const samplePolyline = '_p~iF~ps|U_ulLnnqC_mqNvxq';
  const coords = decodePolyline(samplePolyline);

  const actualStr = `Decoded ${coords.length} coordinates, first: [${coords[0]?.join(', ')}]`;
  const expectedStr = 'Decoded >= 2 coordinates';

  const passed = Array.isArray(coords) && coords.length >= 2;
  recordResult(
    'TC19',
    'FR31',
    'Module 3: Request Lifecycle',
    'Positive',
    'Verify that Google encoded polyline string is decoded into array of [lat, lon] coordinates',
    `polyline: "${samplePolyline}"`,
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(passed);
});

test('TC20 - FR31 (Boundary): Empty or null polyline returns empty array', () => {
  const emptyRes = decodePolyline('');
  const nullRes = decodePolyline(null);

  const actualStr = `empty: [${emptyRes}], null: [${nullRes}]`;
  const expectedStr = 'empty: [], null: []';

  const passed = Array.isArray(emptyRes) && emptyRes.length === 0 && Array.isArray(nullRes) && nullRes.length === 0;
  recordResult(
    'TC20',
    'FR31',
    'Module 3: Request Lifecycle',
    'Boundary',
    'Verify that empty string or null input to polyline decoder returns empty array without throwing',
    'polyline: "" and null',
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(passed);
});

test('TC21 - FR32 (Positive): Bike/scooter maps to TWO_WHEELER mode and 40 km/h', () => {
  const profile = getVehicleRoutingProfile('bike_scooter');
  const actualStr = JSON.stringify(profile);
  const expectedStr = JSON.stringify({ travelMode: 'TWO_WHEELER', speedKmh: 40, vehicleType: 'bike_scooter' });

  const passed = profile.travelMode === 'TWO_WHEELER' && profile.speedKmh === 40;
  recordResult(
    'TC21',
    'FR32',
    'Module 3: Request Lifecycle',
    'Positive',
    'Verify vehicle profile mapping for bike_scooter to TWO_WHEELER and 40 km/h',
    'vehicleType: "bike_scooter"',
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(passed);
});

test('TC22 - FR32 (Positive): Car maps to DRIVE mode and 35 km/h', () => {
  const profile = getVehicleRoutingProfile('car');
  const actualStr = JSON.stringify(profile);
  const expectedStr = JSON.stringify({ travelMode: 'DRIVE', speedKmh: 35, vehicleType: 'car' });

  const passed = profile.travelMode === 'DRIVE' && profile.speedKmh === 35;
  recordResult(
    'TC22',
    'FR32',
    'Module 3: Request Lifecycle',
    'Positive',
    'Verify vehicle profile mapping for car to DRIVE mode and 35 km/h',
    'vehicleType: "car"',
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(passed);
});

test('TC23 - FR33 (Positive): ETA formula computes ceil(distance / speed * 60)', () => {
  // 10 km at 30 km/h = 20 minutes
  const eta = calculateEta(10, 30);
  const actualStr = `${eta} minutes`;
  const expectedStr = '20 minutes';

  const passed = eta === 20;
  recordResult(
    'TC23',
    'FR33',
    'Module 3: Request Lifecycle',
    'Positive',
    'Verify en-route ETA calculation formula: ceil(remaining distance / speed * 60)',
    'distance: 10 km, speed: 30 km/h',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(eta, 20);
});

test('TC24 - FR33 (Boundary): 0.0 km remaining returns 0 minutes ETA', () => {
  const eta = calculateEta(0, 30);
  const actualStr = `${eta} minutes`;
  const expectedStr = '0 minutes';

  const passed = eta === 0;
  recordResult(
    'TC24',
    'FR33',
    'Module 3: Request Lifecycle',
    'Boundary',
    'Verify arrival boundary condition where 0 km distance returns exactly 0 minutes',
    'distance: 0 km, speed: 30 km/h',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(eta, 0);
});

// =============================================================================
// MODULE 4: RATING, PAYMENT & SETTLEMENT
// =============================================================================

test('TC25 - FR39 (Positive): Standard NPCI UPI URI constructed dynamically', () => {
  const uri = buildUpiPaymentUri({
    upiId: 'fixitnow@demo',
    payeeName: 'FixIt Now Marketplace',
    amount: 499,
    note: 'Pro 90-Day Plan',
  });

  const actualStr = uri;
  const expectedStr = 'upi://pay?pa=fixitnow%40demo&pn=FixIt%20Now%20Marketplace&am=499.00&cu=INR&tn=Pro%2090-Day%20Plan';

  const passed = uri.startsWith('upi://pay?') && uri.includes('am=499.00') && uri.includes('cu=INR');
  recordResult(
    'TC25',
    'FR39',
    'Module 4: Payment & Settlement',
    'Positive',
    'Verify dynamic UPI Intent URI formatting with payee, amount, currency and note',
    'upiId: "fixitnow@demo", amount: 499, note: "Pro 90-Day Plan"',
    expectedStr,
    actualStr,
    passed
  );
  assert.ok(passed);
});

// =============================================================================
// MODULE 5: PARTNER PORTAL, KYC & SUBSCRIPTIONS
// =============================================================================

test('TC26 - FR47 (Negative): Malformed payment attempt token returns invalid', async () => {
  const res = await handleScanToken('');
  const actualStr = JSON.stringify(res);
  const expectedStr = JSON.stringify({ success: false, reason: 'invalid' });

  const passed = res.success === false && res.reason === 'invalid';
  recordResult(
    'TC26',
    'FR47',
    'Module 5: Partner Portal & Subscriptions',
    'Negative',
    'Verify that empty or malformed payment token returns invalid status safely',
    'rawToken: ""',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(res.success, false);
  assert.equal(res.reason, 'invalid');
});

// =============================================================================
// MODULE 6: ADMINISTRATOR PORTAL & PLATFORM GOVERNANCE
// =============================================================================

test('TC27 - FR57 (Negative): Admin modification of customer/partner rejected with 403', () => {
  const req = {};
  const res = createMockRes();

  rejectCustomerPartnerMutation(req, res);

  const actualStr = `HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`;
  const expectedStr = 'HTTP 403 Forbidden with strict prohibition message';

  const passed = res.statusCode === 403 && res.data?.status === 'error' && res.data?.message.includes('prohibited');
  recordResult(
    'TC27',
    'FR57',
    'Module 6: Admin Portal & Governance',
    'Negative',
    'Verify strict immutability rule where admin mutations to customer/partner records return HTTP 403',
    'PUT/DELETE /api/admin/customers or /api/admin/partners',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(res.statusCode, 403);
  assert.ok(res.data?.message.includes('prohibited'));
});

// =============================================================================
// MODULE 7: NOTIFICATIONS, SUPPORT & SYSTEM HEALTH
// =============================================================================

test('TC28 - FR72 (Negative): Empty OTP target or code returns false', async () => {
  const res = await verifyOtp('', '123456');
  const actualStr = `verifyOtp: ${res}`;
  const expectedStr = 'verifyOtp: false';

  const passed = res === false;
  recordResult(
    'TC28',
    'FR72',
    'Module 7: Notifications & Support',
    'Negative',
    'Verify that verifying an OTP with missing target email or empty code returns false',
    'target: "", code: "123456"',
    expectedStr,
    actualStr,
    passed
  );
  assert.equal(res, false);
});
