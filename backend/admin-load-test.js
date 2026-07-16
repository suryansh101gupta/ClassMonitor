// ─────────────────────────────────────────────────────────────
//  k6 Admin Load Test — MERN Backend (ClassMonitor)
//  Usage:
//    k6 run admin-load-test.js                         (console output)
//    k6 run --out json=admin-results.json admin-load-test.js  (save data)
//
//  Focus: Admin-specific endpoints and functionality
// ─────────────────────────────────────────────────────────────

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { vu } from "k6/execution";

// ── CONFIG ────────────────────────────────────────────────────
const BASE_URL = "http://host.docker.internal:4000";

// ── STATIC TEST CREDENTIALS ───────────────────────────────────
const ADMIN_CREDS = { email: "testadmin1@mail.com", password: "TESTadmin1@123" };

// ── DYNAMIC REGISTRATION PASSWORD ────────────────────────────
const REG_PASSWORD = "Test@1234";

// ── UNIQUE INDEX per VU per iteration ─────────────────────────
function uniqueIndex() {
  return (vu.idInTest - 1) * 10000 + vu.iterationInScenario + 1;
}

// ── CUSTOM METRICS ────────────────────────────────────────────
const errorRate      = new Rate("admin_error_rate");
const authLatency    = new Trend("admin_auth_latency");
const dbReadLatency  = new Trend("admin_db_read_latency");
const dbWriteLatency = new Trend("admin_db_write_latency");

// Cache testing metrics
const cacheHitRate   = new Rate("admin_cache_hit_rate");
const cacheHitLatency = new Trend("admin_cache_hit_latency");
const cacheMissLatency = new Trend("admin_cache_miss_latency");

// ── LOAD PROFILE ──────────────────────────────────────────────
// 5-minute test with ramp up/down to 100 VUs
export const options = {
  stages: [
    { duration: "30s", target: 20 },   // ramp to 20 VUs
    { duration: "60s", target: 50 },   // ramp to 50 VUs
    { duration: "60s", target: 100 },  // ramp to 100 VUs
    { duration: "60s", target: 100 },  // hold at 100 VUs
    { duration: "30s", target: 50 },   // ramp down to 50 VUs
    { duration: "30s", target: 20 },   // ramp down to 20 VUs
    { duration: "30s", target: 0 },    // ramp down to 0 VUs
  ],

  thresholds: {
    http_req_duration:        ["p(95)<600"],  // 95% of requests under 600ms
    http_req_failed:          ["rate<0.05"],  // error rate under 5%
    admin_error_rate:          ["rate<0.05"],  // business logic error rate under 5%
    admin_auth_latency:        ["p(95)<900"],  // auth routes under 900ms
    admin_db_read_latency:     ["p(95)<500"],  // DB reads under 500ms
    admin_db_write_latency:    ["p(95)<700"],  // DB writes under 700ms
    admin_cache_hit_rate:      ["rate>0.6"],   // cache hit rate above 60%
    admin_cache_hit_latency:   ["p(95)<120"],  // cache hits under 120ms
  },
};

// ── HELPERS ───────────────────────────────────────────────────
const JSON_HEADERS = { "Content-Type": "application/json" };

function safeJson(res) {
  try { return JSON.parse(res.body); } catch (_) { return {}; }
}

function reqParams(cookieToken, tag) {
  const params = {
    headers: JSON_HEADERS,
    tags: { name: tag },
  };
  if (cookieToken) {
    params.cookies = { token: cookieToken };
  }
  return params;
}

// Cache detection helper
function isCacheHit(res) {
  if (res.timings.duration < 100) return true;
  if (res.headers['x-cache'] === 'HIT' || res.headers['x-redis-cache'] === 'HIT') return true;
  return res.timings.duration < 150;
}

function trackCachePerformance(res, endpoint) {
  const isHit = isCacheHit(res);
  
  if (isHit) {
    cacheHitRate.add(1);
    cacheHitLatency.add(res.timings.duration);
    console.log(`[ADMIN CACHE] HIT - ${endpoint}: ${res.timings.duration}ms`);
  } else {
    cacheHitRate.add(0);
    cacheMissLatency.add(res.timings.duration);
    console.log(`[ADMIN CACHE] MISS - ${endpoint}: ${res.timings.duration}ms`);
  }
  
  return isHit;
}

// ── SETUP ───────────────────────────────────────────────────────
export function setup() {
  console.log("🚀 Setting up admin load test...");
  
  const base = { headers: JSON_HEADERS };
  const adminRes = http.post(`${BASE_URL}/admin/login`, JSON.stringify(ADMIN_CREDS), base);
  
  const adminOk = check(adminRes, { "setup: admin login 200": (r) => r.status === 200 });
  if (!adminOk) {
    console.error(`❌ Admin login failed — ${adminRes.status}: ${adminRes.body}`);
    return null;
  }
  
  const adminToken = adminRes.cookies.token ? adminRes.cookies.token[0].value : null;
  if (!adminToken) {
    console.error("❌ Admin cookie token not found in setup.");
    return null;
  }
  
  console.log("✅ Admin setup complete");
  return { adminToken };
}

// ── DEFAULT FUNCTION ─────────────────────────────────────────────
export default function (data) {
  if (!data || !data.adminToken) {
    console.error("❌ No admin token available");
    return;
  }
  
  const { adminToken } = data;
  const idx = uniqueIndex();

  // ────────────────────────────────────────────────────────────
  // GROUP 1: Admin Authentication
  // ────────────────────────────────────────────────────────────
  group("admin authentication", () => {

    // Register new admin
    const regRes = http.post(
      `${BASE_URL}/admin/register`,
      JSON.stringify({
        name: `testadmin${idx}`,
        email: `testadmin${idx}@mail.com`,
        password: REG_PASSWORD,
      }),
      reqParams(null, "admin-register")
    );
    authLatency.add(regRes.timings.duration);
    const regOk = check(regRes, {
      "admin register: status 201":   (r) => r.status === 201,
      "admin register: success true": (r) => safeJson(r).success === true,
      "admin register: latency < 1s": (r) => r.timings.duration < 1000,
    });
    errorRate.add(!regOk);

    // Login with admin credentials
    const loginRes = http.post(
      `${BASE_URL}/admin/login`,
      JSON.stringify(ADMIN_CREDS),
      reqParams(null, "admin-login")
    );
    authLatency.add(loginRes.timings.duration);
    const loginOk = check(loginRes, {
      "admin login: status 200":      (r) => r.status === 200,
      "admin login: success true":    (r) => safeJson(r).success === true,
      "admin login: has token field": (r) => !!safeJson(r).token,
      "admin login: sets cookie":     (r) => r.cookies.token !== undefined,
      "admin login: latency < 1s":    (r) => r.timings.duration < 1000,
    });
    errorRate.add(!loginOk);

    // Check admin authentication
    const authCheckRes = http.get(
      `${BASE_URL}/admin/is-admin-auth`,
      reqParams(adminToken, "admin-is-auth")
    );
    dbReadLatency.add(authCheckRes.timings.duration);
    const authOk = check(authCheckRes, {
      "admin is-auth: status 200":   (r) => r.status === 200,
      "admin is-auth: success true": (r) => safeJson(r).success === true,
    });
    errorRate.add(!authOk);

    sleep(0.3);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 2: Admin Data Operations
  // ────────────────────────────────────────────────────────────
  group("admin data operations", () => {

    // Get admin data
    const adminDataRes = http.get(
      `${BASE_URL}/admin-data/data`,
      reqParams(adminToken, "admin-data")
    );
    dbReadLatency.add(adminDataRes.timings.duration);
    const adminDataOk = check(adminDataRes, {
      "admin-data: status 200":      (r) => r.status === 200,
      "admin-data: success true":    (r) => safeJson(r).success === true,
      "admin-data: latency < 500ms": (r) => r.timings.duration < 500,
    });
    errorRate.add(!adminDataOk);

    sleep(0.2);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 3: Cached Endpoints Testing
  // ────────────────────────────────────────────────────────────
  group("admin cached endpoints", () => {

    // Get all subjects (cached)
    const subRes = http.get(
      `${BASE_URL}/subjects/get-all-subjects`,
      reqParams(adminToken, "get-all-subjects")
    );
    
    const isCacheHit = trackCachePerformance(subRes, "subjects");
    dbReadLatency.add(subRes.timings.duration);
    const subOk = check(subRes, {
      "subjects: status 200":      (r) => r.status === 200,
      "subjects: has data array":  (r) => Array.isArray(safeJson(r).data),
      "subjects: latency < 500ms": (r) => r.timings.duration < 500,
      "subjects: cache working":    (r) => isCacheHit || r.timings.duration < 400,
    });
    errorRate.add(!subOk);

    // Get all teachers (cached)
    const teachRes = http.get(
      `${BASE_URL}/teachers/get-all-teachers`,
      reqParams(adminToken, "get-all-teachers")
    );
    
    const isCacheHit2 = trackCachePerformance(teachRes, "teachers");
    dbReadLatency.add(teachRes.timings.duration);
    const teachOk = check(teachRes, {
      "teachers: status 200":      (r) => r.status === 200,
      "teachers: has data array":  (r) => Array.isArray(safeJson(r).data),
      "teachers: latency < 500ms": (r) => r.timings.duration < 500,
      "teachers: cache working":    (r) => isCacheHit2 || r.timings.duration < 400,
    });
    errorRate.add(!teachOk);

    // Get all classes (cached)
    const classRes = http.get(
      `${BASE_URL}/classes/get-all-classes`,
      reqParams(null, "get-all-classes")
    );
    
    const isCacheHit3 = trackCachePerformance(classRes, "classes");
    dbReadLatency.add(classRes.timings.duration);
    const classOk = check(classRes, {
      "classes: status 200":      (r) => r.status === 200,
      "classes: has data array":  (r) => Array.isArray(safeJson(r).data),
      "classes: latency < 500ms": (r) => r.timings.duration < 500,
      "classes: cache working":    (r) => isCacheHit3 || r.timings.duration < 400,
    });
    errorRate.add(!classOk);

    sleep(0.3);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 4: Admin Write Operations
  // ────────────────────────────────────────────────────────────
  group("admin write operations", () => {

    // Create subject
    const subRes = http.post(
      `${BASE_URL}/subjects/create-sub`,
      JSON.stringify({ name: `test-subject-${idx}` }),
      reqParams(adminToken, "create-subject")
    );
    dbWriteLatency.add(subRes.timings.duration);
    const subOk = check(subRes, {
      "create subject: status 201":      (r) => r.status === 201,
      "create subject: success true":    (r) => safeJson(r).success === true,
      "create subject: latency < 800ms": (r) => r.timings.duration < 800,
    });
    errorRate.add(!subOk);

    // Create class
    const classRes = http.post(
      `${BASE_URL}/classes/create-class`,
      JSON.stringify({ name: `test-class-${idx}` }),
      reqParams(adminToken, "create-class")
    );
    dbWriteLatency.add(classRes.timings.duration);
    const classOk = check(classRes, {
      "create class: status 201":      (r) => r.status === 201,
      "create class: success true":    (r) => safeJson(r).success === true,
      "create class: latency < 800ms": (r) => r.timings.duration < 800,
    });
    errorRate.add(!classOk);

    sleep(0.3);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 5: Admin Logout
  // ────────────────────────────────────────────────────────────
  group("admin logout", () => {

    // Fresh login for logout test
    http.post(
      `${BASE_URL}/admin/login`,
      JSON.stringify(ADMIN_CREDS),
      reqParams(null, "admin-fresh-login-for-logout")
    );

    const logoutRes = http.post(
      `${BASE_URL}/admin/logout`,
      null,
      { headers: JSON_HEADERS, tags: { name: "admin-logout" } }
    );
    authLatency.add(logoutRes.timings.duration);
    const logoutOk = check(logoutRes, {
      "admin logout: status 200":   (r) => r.status === 200,
      "admin logout: success true": (r) => safeJson(r).success === true,
    });
    errorRate.add(!logoutOk);

    sleep(0.3);
  });

  // Realistic think time between iterations
  sleep(Math.random() * 1 + 0.5); // random 0.5–1.5s
}

// ── TEARDOWN ───────────────────────────────────────────────────
export function teardown(data) {
  if (data && data.adminToken) {
    console.log("✅ Admin load test completed successfully");
  } else {
    console.log("❌ Admin load test completed with errors");
  }
}
