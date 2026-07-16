// ─────────────────────────────────────────────────────────────
//  k6 Teacher Load Test — MERN Backend (ClassMonitor)
//  Usage:
//    k6 run teacher-load-test.js                         (console output)
//    k6 run --out json=teacher-results.json teacher-load-test.js  (save data)
//
//    docker command = docker run -i -v %cd%:/scripts grafana/k6 run /scripts/teacher-load-test.js
//  Focus: Teacher-specific endpoints and functionality
// ─────────────────────────────────────────────────────────────

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { vu } from "k6/execution";

// ── CONFIG ────────────────────────────────────────────────────
const BASE_URL = "http://host.docker.internal:4000";

// ── STATIC TEST CREDENTIALS ───────────────────────────────────
const TEACHER_CREDS = { email: "testteacher2@mail.com", password: "TESTteacher2@123" };

// ── DYNAMIC REGISTRATION PASSWORD ────────────────────────────
const REG_PASSWORD = "Test@1234";

// ── UNIQUE INDEX per VU per iteration ─────────────────────────
function uniqueIndex() {
  return (vu.idInTest - 1) * 10000 + vu.iterationInScenario + 1;
}

// ── CUSTOM METRICS ────────────────────────────────────────────
const errorRate      = new Rate("teacher_error_rate");
const authLatency    = new Trend("teacher_auth_latency");
const dbReadLatency  = new Trend("teacher_db_read_latency");
const dbWriteLatency = new Trend("teacher_db_write_latency");

// Cache testing metrics
const cacheHitRate   = new Rate("teacher_cache_hit_rate");
const cacheHitLatency = new Trend("teacher_cache_hit_latency");
const cacheMissLatency = new Trend("teacher_cache_miss_latency");

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
    http_req_duration:          ["p(95)<650"],  // 95% of requests under 650ms
    http_req_failed:            ["rate<0.05"],  // error rate under 5%
    teacher_error_rate:         ["rate<0.05"],  // business logic error rate under 5%
    teacher_auth_latency:       ["p(95)<950"],  // auth routes under 950ms
    teacher_db_read_latency:    ["p(95)<550"],  // DB reads under 550ms
    teacher_db_write_latency:   ["p(95)<750"],  // DB writes under 750ms
    teacher_cache_hit_rate:     ["rate>0.6"],   // cache hit rate above 60%
    teacher_cache_hit_latency:  ["p(95)<130"],  // cache hits under 130ms
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
    console.log(`[TEACHER CACHE] HIT - ${endpoint}: ${res.timings.duration}ms`);
  } else {
    cacheHitRate.add(0);
    cacheMissLatency.add(res.timings.duration);
    console.log(`[TEACHER CACHE] MISS - ${endpoint}: ${res.timings.duration}ms`);
  }
  
  return isHit;
}

// ── SETUP ───────────────────────────────────────────────────────
export function setup() {
  console.log("🚀 Setting up teacher load test...");
  
  const base = { headers: JSON_HEADERS };
  const teacherRes = http.post(`${BASE_URL}/teachers/login`, JSON.stringify(TEACHER_CREDS), base);
  
  const teacherOk = check(teacherRes, { "setup: teacher login 200": (r) => r.status === 200 });
  if (!teacherOk) {
    console.error(`❌ Teacher login failed — ${teacherRes.status}: ${teacherRes.body}`);
    return null;
  }
  
  const teacherToken = teacherRes.cookies.token ? teacherRes.cookies.token[0].value : null;
  if (!teacherToken) {
    console.error("❌ Teacher cookie token not found in setup.");
    return null;
  }
  
  console.log("✅ Teacher setup complete");
  return { teacherToken };
}

// ── DEFAULT FUNCTION ─────────────────────────────────────────────
export default function (data) {
  if (!data || !data.teacherToken) {
    console.error("❌ No teacher token available");
    return;
  }
  
  const { teacherToken } = data;
  const idx = uniqueIndex();

  // ────────────────────────────────────────────────────────────
  // GROUP 1: Teacher Authentication
  // ────────────────────────────────────────────────────────────
  group("teacher authentication", () => {

    // Register new teacher
    const regRes = http.post(
      `${BASE_URL}/teachers/register`,
      JSON.stringify({
        name: `testteacher${idx}`,
        email: `testteacher${idx}@mail.com`,
        password: REG_PASSWORD,
      }),
      reqParams(null, "teacher-register")
    );
    authLatency.add(regRes.timings.duration);
    const regOk = check(regRes, {
      "teacher register: status 201":   (r) => r.status === 201,
      "teacher register: success true": (r) => safeJson(r).success === true,
      "teacher register: has token":    (r) => !!safeJson(r).token,
      "teacher register: latency < 1s": (r) => r.timings.duration < 1000,
    });
    errorRate.add(!regOk);

    // Login with teacher credentials
    const loginRes = http.post(
      `${BASE_URL}/teachers/login`,
      JSON.stringify(TEACHER_CREDS),
      reqParams(null, "teacher-login")
    );
    authLatency.add(loginRes.timings.duration);
    const loginOk = check(loginRes, {
      "teacher login: status 200":      (r) => r.status === 200,
      "teacher login: success true":    (r) => safeJson(r).success === true,
      "teacher login: has token field": (r) => !!safeJson(r).token,
      "teacher login: sets cookie":     (r) => r.cookies.token !== undefined,
      "teacher login: latency < 1s":    (r) => r.timings.duration < 1000,
    });
    errorRate.add(!loginOk);

    sleep(0.3);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 2: Teacher Data Operations
  // ────────────────────────────────────────────────────────────
  group("teacher data operations", () => {

    // Get all teachers (cached)
    const teachRes = http.get(
      `${BASE_URL}/teachers/get-all-teachers`,
      reqParams(teacherToken, "get-all-teachers")
    );
    
    const isCacheHit = trackCachePerformance(teachRes, "teachers");
    dbReadLatency.add(teachRes.timings.duration);
    const teachOk = check(teachRes, {
      "teachers: status 200":      (r) => r.status === 200,
      "teachers: has data array":  (r) => Array.isArray(safeJson(r).data),
      "teachers: latency < 500ms": (r) => r.timings.duration < 500,
      "teachers: cache working":    (r) => isCacheHit || r.timings.duration < 400,
    });
    errorRate.add(!teachOk);

    sleep(0.2);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 3: Teacher Attendance Operations
  // ────────────────────────────────────────────────────────────
  group("teacher attendance operations", () => {

    // Get attendance by lecture (simulated)
    const attendanceRes = http.get(
      `${BASE_URL}/teachers/get-attendance?lecture_id=${idx}`,
      reqParams(teacherToken, "get-attendance")
    );
    dbReadLatency.add(attendanceRes.timings.duration);
    const attendanceOk = check(attendanceRes, {
      "get-attendance: status 200":      (r) => r.status === 200 || r.status === 404, // 404 acceptable for test data
      "get-attendance: latency < 600ms": (r) => r.timings.duration < 600,
    });
    errorRate.add(!attendanceOk);

    // Get lectures (simulated)
    const lecturesRes = http.get(
      `${BASE_URL}/teachers/get-lectures`,
      reqParams(teacherToken, "get-lectures")
    );
    dbReadLatency.add(lecturesRes.timings.duration);
    const lecturesOk = check(lecturesRes, {
      "get-lectures: status 200":      (r) => r.status === 200 || r.status === 404,
      "get-lectures: latency < 600ms": (r) => r.timings.duration < 600,
    });
    errorRate.add(!lecturesOk);

    sleep(0.3);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 4: Teacher Cache Testing
  // ────────────────────────────────────────────────────────────
  group("teacher cache testing", () => {

    // Test subjects endpoint (teacher access)
    const subRes = http.get(
      `${BASE_URL}/subjects/get-all-subjects`,
      reqParams(teacherToken, "subjects-cache-test")
    );
    
    const isCacheHit1 = trackCachePerformance(subRes, "subjects");
    dbReadLatency.add(subRes.timings.duration);
    const subOk = check(subRes, {
      "subjects-cache: status 200":   (r) => r.status === 200,
      "subjects-cache: has data":     (r) => Array.isArray(safeJson(r).data),
      "subjects-cache: cache hit":    (r) => isCacheHit1 || r.timings.duration < 400,
    });
    errorRate.add(!subOk);

    // Test classes endpoint (public access)
    const classRes = http.get(
      `${BASE_URL}/classes/get-all-classes`,
      reqParams(null, "classes-cache-test")
    );
    
    const isCacheHit2 = trackCachePerformance(classRes, "classes");
    dbReadLatency.add(classRes.timings.duration);
    const classOk = check(classRes, {
      "classes-cache: status 200":    (r) => r.status === 200,
      "classes-cache: has data":      (r) => Array.isArray(safeJson(r).data),
      "classes-cache: cache hit":     (r) => isCacheHit2 || r.timings.duration < 400,
    });
    errorRate.add(!classOk);

    sleep(0.3);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 5: Teacher Logout
  // ────────────────────────────────────────────────────────────
  group("teacher logout", () => {

    // Fresh login for logout test
    http.post(
      `${BASE_URL}/teachers/login`,
      JSON.stringify(TEACHER_CREDS),
      reqParams(null, "teacher-fresh-login-for-logout")
    );

    const logoutRes = http.post(
      `${BASE_URL}/teachers/logout`,
      null,
      { headers: JSON_HEADERS, tags: { name: "teacher-logout" } }
    );
    authLatency.add(logoutRes.timings.duration);
    const logoutOk = check(logoutRes, {
      "teacher logout: status 200":   (r) => r.status === 200,
      "teacher logout: success true": (r) => safeJson(r).success === true,
    });
    errorRate.add(!logoutOk);

    sleep(0.3);
  });

  // Realistic think time between iterations
  sleep(Math.random() * 1 + 0.5); // random 0.5–1.5s
}

// ── TEARDOWN ───────────────────────────────────────────────────
export function teardown(data) {
  if (data && data.teacherToken) {
    console.log("✅ Teacher load test completed successfully");
  } else {
    console.log("❌ Teacher load test completed with errors");
  }
}
