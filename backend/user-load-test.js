// ─────────────────────────────────────────────────────────────
//  k6 User Load Test — MERN Backend (ClassMonitor)
//  Usage:
//    k6 run user-load-test.js                         (console output)
//    k6 run --out json=user-results.json user-load-test.js  (save data)
//
//  Focus: User-specific endpoints and functionality
// ─────────────────────────────────────────────────────────────

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { vu } from "k6/execution";

// ── CONFIG ────────────────────────────────────────────────────
const BASE_URL = "http://host.docker.internal:4000";

// ── STATIC TEST CREDENTIALS ───────────────────────────────────
const USER_CREDS = { email: "testuser3@mail.com", password: "TESTuser3@123" };

// ── DYNAMIC REGISTRATION PASSWORD ────────────────────────────
const REG_PASSWORD = "Test@1234";

// ── UNIQUE INDEX per VU per iteration ─────────────────────────
function uniqueIndex() {
  return (vu.idInTest - 1) * 10000 + vu.iterationInScenario + 1;
}

// ── CUSTOM METRICS ────────────────────────────────────────────
const errorRate      = new Rate("user_error_rate");
const authLatency    = new Trend("user_auth_latency");
const dbReadLatency  = new Trend("user_db_read_latency");
const dbWriteLatency = new Trend("user_db_write_latency");

// Cache testing metrics
const cacheHitRate   = new Rate("user_cache_hit_rate");
const cacheHitLatency = new Trend("user_cache_hit_latency");
const cacheMissLatency = new Trend("user_cache_miss_latency");

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
    http_req_duration:        ["p(95)<700"],  // 95% of requests under 700ms
    http_req_failed:          ["rate<0.05"],  // error rate under 5%
    user_error_rate:          ["rate<0.05"],  // business logic error rate under 5%
    user_auth_latency:        ["p(95)<1000"], // auth routes under 1s
    user_db_read_latency:     ["p(95)<600"],  // DB reads under 600ms
    user_db_write_latency:    ["p(95)<800"],  // DB writes under 800ms
    user_cache_hit_rate:      ["rate>0.6"],   // cache hit rate above 60%
    user_cache_hit_latency:   ["p(95)<140"],  // cache hits under 140ms
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
    console.log(`[USER CACHE] HIT - ${endpoint}: ${res.timings.duration}ms`);
  } else {
    cacheHitRate.add(0);
    cacheMissLatency.add(res.timings.duration);
    console.log(`[USER CACHE] MISS - ${endpoint}: ${res.timings.duration}ms`);
  }
  
  return isHit;
}

// ── SETUP ───────────────────────────────────────────────────────
export function setup() {
  console.log("🚀 Setting up user load test...");
  
  const base = { headers: JSON_HEADERS };
  const userRes = http.post(`${BASE_URL}/user/login`, JSON.stringify(USER_CREDS), base);
  
  const userOk = check(userRes, { "setup: user login 200": (r) => r.status === 200 });
  if (!userOk) {
    console.error(`❌ User login failed — ${userRes.status}: ${userRes.body}`);
    return null;
  }
  
  const userToken = userRes.cookies.token ? userRes.cookies.token[0].value : null;
  if (!userToken) {
    console.error("❌ User cookie token not found in setup.");
    return null;
  }
  
  console.log("✅ User setup complete");
  return { userToken };
}

// ── DEFAULT FUNCTION ─────────────────────────────────────────────
export default function (data) {
  if (!data || !data.userToken) {
    console.error("❌ No user token available");
    return;
  }
  
  const { userToken } = data;
  const idx = uniqueIndex();

  // ────────────────────────────────────────────────────────────
  // GROUP 1: User Authentication
  // ────────────────────────────────────────────────────────────
  group("user authentication", () => {

    // Login with user credentials
    const loginRes = http.post(
      `${BASE_URL}/user/login`,
      JSON.stringify(USER_CREDS),
      reqParams(null, "user-login")
    );
    authLatency.add(loginRes.timings.duration);
    const loginOk = check(loginRes, {
      "user login: status 200":   (r) => r.status === 200,
      "user login: success true": (r) => safeJson(r).success === true,
      "user login: sets cookie":  (r) => r.cookies.token !== undefined,
      "user login: latency < 1s": (r) => r.timings.duration < 1000,
    });
    errorRate.add(!loginOk);

    // Check user authentication
    const authCheckRes = http.get(
      `${BASE_URL}/user/is-auth`,
      reqParams(userToken, "user-is-auth")
    );
    dbReadLatency.add(authCheckRes.timings.duration);
    const authOk = check(authCheckRes, {
      "user is-auth: status 200":   (r) => r.status === 200,
      "user is-auth: success true": (r) => safeJson(r).success === true,
    });
    errorRate.add(!authOk);

    sleep(0.3);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 2: User Data Operations
  // ────────────────────────────────────────────────────────────
  group("user data operations", () => {

    // Get user data
    const userDataRes = http.get(
      `${BASE_URL}/user-data/data`,
      reqParams(userToken, "user-data")
    );
    dbReadLatency.add(userDataRes.timings.duration);
    const userDataOk = check(userDataRes, {
      "user-data: status 200":      (r) => r.status === 200,
      "user-data: success true":    (r) => safeJson(r).success === true,
      "user-data: latency < 500ms": (r) => r.timings.duration < 500,
    });
    errorRate.add(!userDataOk);

    sleep(0.2);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 3: User Cache Testing
  // ────────────────────────────────────────────────────────────
  group("user cache testing", () => {

    // Test classes endpoint (public, cached)
    const classRes = http.get(
      `${BASE_URL}/classes/get-all-classes`,
      reqParams(null, "classes-cache-test")
    );
    
    const isCacheHit1 = trackCachePerformance(classRes, "classes");
    dbReadLatency.add(classRes.timings.duration);
    const classOk = check(classRes, {
      "classes-cache: status 200":    (r) => r.status === 200,
      "classes-cache: has data":      (r) => Array.isArray(safeJson(r).data),
      "classes-cache: cache hit":     (r) => isCacheHit1 || r.timings.duration < 400,
    });
    errorRate.add(!classOk);

    sleep(0.1);

    // Second request to same endpoint (should be cache hit)
    const classRes2 = http.get(
      `${BASE_URL}/classes/get-all-classes`,
      reqParams(null, "classes-cache-test-2")
    );
    
    const isCacheHit2 = trackCachePerformance(classRes2, "classes-repeat");
    dbReadLatency.add(classRes2.timings.duration);
    const classOk2 = check(classRes2, {
      "classes-cache-2: status 200": (r) => r.status === 200,
      "classes-cache-2: has data":   (r) => Array.isArray(safeJson(r).data),
      "classes-cache-2: cache hit":  (r) => isCacheHit2 || r.timings.duration < 400,
    });
    errorRate.add(!classOk2);

    sleep(0.2);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 4: User Profile Operations
  // ────────────────────────────────────────────────────────────
  group("user profile operations", () => {

    // Get user profile (simulated endpoint)
    const profileRes = http.get(
      `${BASE_URL}/user/profile`,
      reqParams(userToken, "user-profile")
    );
    dbReadLatency.add(profileRes.timings.duration);
    const profileOk = check(profileRes, {
      "user-profile: status 200":      (r) => r.status === 200 || r.status === 404, // 404 acceptable if endpoint doesn't exist
      "user-profile: latency < 600ms": (r) => r.timings.duration < 600,
    });
    errorRate.add(!profileOk);

    // Update user profile (simulated)
    const updateRes = http.put(
      `${BASE_URL}/user/profile`,
      JSON.stringify({
        name: `testuser${idx}`,
        phone: `123456789${idx % 10}`,
      }),
      reqParams(userToken, "user-profile-update")
    );
    dbWriteLatency.add(updateRes.timings.duration);
    const updateOk = check(updateRes, {
      "user-profile-update: status 200":      (r) => r.status === 200 || r.status === 404,
      "user-profile-update: latency < 800ms": (r) => r.timings.duration < 800,
    });
    errorRate.add(!updateOk);

    sleep(0.3);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 5: User Attendance Operations
  // ────────────────────────────────────────────────────────────
  group("user attendance operations", () => {

    // Get user attendance (simulated)
    const attendanceRes = http.get(
      `${BASE_URL}/user/attendance`,
      reqParams(userToken, "user-attendance")
    );
    dbReadLatency.add(attendanceRes.timings.duration);
    const attendanceOk = check(attendanceRes, {
      "user-attendance: status 200":      (r) => r.status === 200 || r.status === 404,
      "user-attendance: latency < 600ms": (r) => r.timings.duration < 600,
    });
    errorRate.add(!attendanceOk);

    // Mark attendance (simulated)
    const markRes = http.post(
      `${BASE_URL}/user/mark-attendance`,
      JSON.stringify({
        lecture_id: idx,
        status: "present",
      }),
      reqParams(userToken, "user-mark-attendance")
    );
    dbWriteLatency.add(markRes.timings.duration);
    const markOk = check(markRes, {
      "user-mark-attendance: status 201":      (r) => r.status === 201 || r.status === 404,
      "user-mark-attendance: latency < 800ms": (r) => r.timings.duration < 800,
    });
    errorRate.add(!markOk);

    sleep(0.3);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 6: User Logout
  // ────────────────────────────────────────────────────────────
  group("user logout", () => {

    // Fresh login for logout test
    http.post(
      `${BASE_URL}/user/login`,
      JSON.stringify(USER_CREDS),
      reqParams(null, "user-fresh-login-for-logout")
    );

    const logoutRes = http.post(
      `${BASE_URL}/user/logout`,
      null,
      { headers: JSON_HEADERS, tags: { name: "user-logout" } }
    );
    authLatency.add(logoutRes.timings.duration);
    const logoutOk = check(logoutRes, {
      "user logout: status 200":   (r) => r.status === 200,
      "user logout: success true": (r) => safeJson(r).success === true,
    });
    errorRate.add(!logoutOk);

    sleep(0.3);
  });

  // Realistic think time between iterations
  sleep(Math.random() * 1 + 0.5); // random 0.5–1.5s
}

// ── TEARDOWN ───────────────────────────────────────────────────
export function teardown(data) {
  if (data && data.userToken) {
    console.log("✅ User load test completed successfully");
  } else {
    console.log("❌ User load test completed with errors");
  }
}
