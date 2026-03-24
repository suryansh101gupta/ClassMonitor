// ─────────────────────────────────────────────────────────────
//  k6 Load Test — MERN Backend (ClassMonitor)
//  Usage:
//    k6 run load-test.js                         (console output)
//    k6 run --out json=results.json load-test.js  (save raw data)
//    k6 run --out csv=results.csv  load-test.js   (save CSV)
//
//  Auth: All routes use HTTP-only cookie ("token") set by the server.
//  k6 automatically forwards cookies within the same VU session/jar.
//  For setup() tokens (shared across VUs), we pass the cookie explicitly.
// ─────────────────────────────────────────────────────────────

// docker command = docker run -i -v %cd%:/scripts grafana/k6 run /scripts/load-test.js

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { vu, scenario } from "k6/execution"; // CHANGED: import vu for __VU and __ITER equivalents

// ── CONFIG ────────────────────────────────────────────────────
const BASE_URL = "http://host.docker.internal:4000";

// ── STATIC TEST CREDENTIALS ───────────────────────────────────
const ADMIN_CREDS   = { email: "testadmin1@mail.com",   password: "TESTadmin1@123"   };
const TEACHER_CREDS = { email: "testteacher2@mail.com", password: "TESTteacher2@123" };
const USER_CREDS    = { email: "testuser3@mail.com",    password: "TESTuser3@123"    };

// ── DYNAMIC REGISTRATION PASSWORD ────────────────────────────
const REG_PASSWORD = "Test@1234";

// ── UNIQUE INDEX per VU per iteration ─────────────────────────
// CHANGED: use vu.idInTest and vu.iterationInScenario from k6/execution
// Each VU gets its own block of 10000 indices → no collisions even under high load.
function uniqueIndex() {
  return (vu.idInTest - 1) * 10000 + vu.iterationInScenario + 1;
}

// ── CUSTOM METRICS ────────────────────────────────────────────
const errorRate      = new Rate("custom_error_rate");        // % of failed requests
const authLatency    = new Trend("custom_auth_latency");     // login/register time
const dbReadLatency  = new Trend("custom_db_read_latency");  // GET with DB read
const dbWriteLatency = new Trend("custom_db_write_latency"); // POST that writes to DB

// ── LOAD PROFILE ──────────────────────────────────────────────
//  Stage 1 — Ramp up to 10 VUs   (warm up)
//  Stage 2 — Hold at 10 VUs      (baseline   ← record p95 here)
//  Stage 3 — Ramp to 50 VUs      (moderate load)
//  Stage 4 — Hold at 50 VUs      (medium     ← record p95 here)
//  Stage 5 — Ramp to 100 VUs     (stress)
//  Stage 6 — Hold at 100 VUs     (peak       ← record p95 here)
//  Stage 7 — Ramp down           (cool down)
export const options = {
  stages: [
    { duration: "30s", target: 10  }, // ramp to baseline
    { duration: "60s", target: 10  }, // hold baseline
    { duration: "30s", target: 50  }, // ramp to medium
    { duration: "60s", target: 50  }, // hold medium
    { duration: "30s", target: 100 }, // ramp to peak
    { duration: "60s", target: 100 }, // hold peak
    { duration: "30s", target: 0  }, // ramp down
  ],

  // ── THRESHOLDS ─────────────────────────────────────────────
  thresholds: {
    http_req_duration:        ["p(95)<550"],  // 95% of all requests under 550ms
    http_req_failed:          ["rate<0.03"],  // global HTTP error rate under 3%
    custom_error_rate:        ["rate<0.03"],  // business logic error rate under 3%
    custom_db_read_latency:   ["p(95)<450"],  // DB reads under 450ms
    custom_db_write_latency:  ["p(95)<650"],  // DB writes under 650ms
    custom_auth_latency:      ["p(95)<850"],  // auth routes under 850ms
  },
};

// ── HELPERS ───────────────────────────────────────────────────
const JSON_HEADERS = { "Content-Type": "application/json" };

// Safe JSON parse — returns {} on failure so .success checks never throw
function safeJson(res) {
  try { return JSON.parse(res.body); } catch (_) { return {}; }
}

// Build request params.
// Pass cookieToken to explicitly set the auth cookie (used with setup tokens).
// Pass null to rely on k6's automatic VU cookie jar instead.
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

// ── SETUP: runs once before the test, shares tokens with all VUs ──
export function setup() {
  const base = { headers: JSON_HEADERS };

  // ── Admin login
  // loginAdmin sets HTTP-only cookie AND returns token in body
  const adminRes = http.post(`${BASE_URL}/admin/login`, JSON.stringify(ADMIN_CREDS), base);
  const adminOk  = check(adminRes, { "setup: admin login 200": (r) => r.status === 200 });
  if (!adminOk) console.warn(`⚠️  Admin login failed — ${adminRes.status}: ${adminRes.body}`);
  const adminToken = adminRes.cookies.token ? adminRes.cookies.token[0].value : null;
  if (!adminToken) console.warn("⚠️  Admin cookie token not found in setup.");

  // ── Teacher login
  // loginTeacher sets HTTP-only cookie AND returns token in body
  const teacherRes = http.post(`${BASE_URL}/teachers/login`, JSON.stringify(TEACHER_CREDS), base);
  const teacherOk  = check(teacherRes, { "setup: teacher login 200": (r) => r.status === 200 });
  if (!teacherOk) console.warn(`⚠️  Teacher login failed — ${teacherRes.status}: ${teacherRes.body}`);
  const teacherToken = teacherRes.cookies.token ? teacherRes.cookies.token[0].value : null;
  if (!teacherToken) console.warn("⚠️  Teacher cookie token not found in setup.");

  // ── User login
  // login sets HTTP-only cookie only — does NOT return token in body
  const userRes = http.post(`${BASE_URL}/user/login`, JSON.stringify(USER_CREDS), base);
  const userOk  = check(userRes, { "setup: user login 200": (r) => r.status === 200 });
  if (!userOk) console.warn(`⚠️  User login failed — ${userRes.status}: ${userRes.body}`);
  const userToken = userRes.cookies.token ? userRes.cookies.token[0].value : null;
  if (!userToken) console.warn("⚠️  User cookie token not found in setup.");

  return { adminToken, teacherToken, userToken };
}

// ── DEFAULT FUNCTION: runs for every VU every iteration ───────
export default function (data) {
  const { adminToken, teacherToken, userToken } = data;
  const idx = uniqueIndex();

  // ────────────────────────────────────────────────────────────
  // GROUP 1: Admin Auth Routes
  // POST /admin/register      — public
  // POST /admin/login         — public
  // GET  /admin/is-admin-auth — adminAuth (cookie)
  // ────────────────────────────────────────────────────────────
  group("admin auth routes", () => {

    // Register a new admin (unique email per VU/iter)
    // registerAdmin: 201 + { success: true, admin: {...} } — no token in body
    const regRes = http.post(
      `${BASE_URL}/admin/register`,
      JSON.stringify({
        name:     `testadmin${idx}`,
        email:    `testadmin${idx}@mail.com`, // CHANGED: idx is now collision-safe
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

    // Login with static admin credentials
    // loginAdmin: 200 + { success: true, token: "...", admin: {...} }
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

    // is-admin-auth — pass setup cookie token explicitly
    if (adminToken) {
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
    }

    sleep(0.5);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 2: Teacher Auth Routes
  // POST /teachers/register — public
  // POST /teachers/login    — public
  // ────────────────────────────────────────────────────────────
  // group("teacher auth routes", () => {

    // Register a new teacher (unique email per VU/iter)
    // registerTeacher: 201 + { success: true, teacher: {...}, token: "..." }
    const regRes = http.post(
      `${BASE_URL}/teachers/register`,
      JSON.stringify({
        name:     `testteacher${idx}`,
        email:    `testteacher${idx}@mail.com`, // CHANGED: idx is now collision-safe
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

  //   // Login with static teacher credentials
    // loginTeacher: 200 + { success: true, message: "logged in", token: "..." }
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

    sleep(0.5);
  // });

  // ────────────────────────────────────────────────────────────
  // GROUP 3: User Auth Routes
  // POST /user/login   — public (cookie only, no token in body)
  // GET  /user/is-auth — userAuth (cookie)
  //
  // /user/register is skipped — requires a valid class_id from MySQL
  // which cannot be safely generated without a seeded ID.
  // ────────────────────────────────────────────────────────────
  group("user auth routes", () => {

    // Login with static user credentials
    // login: 200 + { success: true, message: "logged in" } — no token in body
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

    // is-auth — pass setup cookie token explicitly
    if (userToken) {
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
    }

    sleep(0.5);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 4: DB Read Routes
  // GET /subjects/get-all-subjects  — adminAuth (cookie)
  // GET /teachers/get-all-teachers  — adminAuth (cookie)
  // GET /admin-data/data            — adminAuth (cookie)
  // GET /classes/get-all-classes    — public
  // GET /user-data/data             — userAuth (cookie)
  // ────────────────────────────────────────────────────────────
  group("db read routes", () => {

    // GET /subjects/get-all-subjects
    if (adminToken) {
      const subRes = http.get(
        `${BASE_URL}/subjects/get-all-subjects`,
        reqParams(adminToken, "get-all-subjects")
      );
      dbReadLatency.add(subRes.timings.duration);
      const subOk = check(subRes, {
        "subjects: status 200":      (r) => r.status === 200,
        "subjects: has data array":  (r) => Array.isArray(safeJson(r).data),
        "subjects: latency < 500ms": (r) => r.timings.duration < 500,
      });
      errorRate.add(!subOk);
    }

    // GET /teachers/get-all-teachers
    if (adminToken) {
      const teachRes = http.get(
        `${BASE_URL}/teachers/get-all-teachers`,
        reqParams(adminToken, "get-all-teachers")
      );
      dbReadLatency.add(teachRes.timings.duration);
      const teachOk = check(teachRes, {
        "teachers: status 200":      (r) => r.status === 200,
        "teachers: has data array":  (r) => Array.isArray(safeJson(r).data),
        "teachers: latency < 500ms": (r) => r.timings.duration < 500,
      });
      errorRate.add(!teachOk);
    }

    // GET /admin-data/data
    if (adminToken) {
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
    }

    // GET /classes/get-all-classes (public)
    const classRes = http.get(
      `${BASE_URL}/classes/get-all-classes`,
      reqParams(null, "get-all-classes")
    );
    dbReadLatency.add(classRes.timings.duration);
    const classOk = check(classRes, {
      "classes: status 200":      (r) => r.status === 200,
      "classes: has data array":  (r) => Array.isArray(safeJson(r).data),
      "classes: latency < 500ms": (r) => r.timings.duration < 500,
    });
    errorRate.add(!classOk);

    // GET /user-data/data
    if (userToken) {
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
    }

    sleep(0.5);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 5: DB Write Routes
  // POST /subjects/create-sub   — adminAuth (cookie)
  // POST /classes/create-class  — adminAuth (cookie)
  //
  // POST /admin/assign-sub-teacher — skipped (requires seeded IDs)
  // ────────────────────────────────────────────────────────────
  group("db write routes", () => {

    if (adminToken) {
      // POST /subjects/create-sub
      const subRes = http.post(
        `${BASE_URL}/subjects/create-sub`,
        JSON.stringify({ name: `test-subject-${idx}` }), // CHANGED: idx is now collision-safe
        reqParams(adminToken, "create-subject")
      );
      dbWriteLatency.add(subRes.timings.duration);
      const subOk = check(subRes, {
        "create subject: status 201":      (r) => r.status === 201,
        "create subject: success true":    (r) => safeJson(r).success === true,
        "create subject: latency < 800ms": (r) => r.timings.duration < 800,
      });
      errorRate.add(!subOk);

      // POST /classes/create-class
      const classRes = http.post(
        `${BASE_URL}/classes/create-class`,
        JSON.stringify({ name: `test-class-${idx}` }), // CHANGED: idx is now collision-safe
        reqParams(adminToken, "create-class")
      );
      dbWriteLatency.add(classRes.timings.duration);
      const classOk = check(classRes, {
        "create class: status 201":      (r) => r.status === 201,
        "create class: success true":    (r) => safeJson(r).success === true,
        "create class: latency < 800ms": (r) => r.timings.duration < 800,
      });
      errorRate.add(!classOk);
    }

    sleep(0.5);
  });

  // ────────────────────────────────────────────────────────────
  // GROUP 6: Logout Routes
  // POST /admin/logout    — adminAuth (cookie)
  // POST /teachers/logout — teacherAuth (cookie)
  // POST /user/logout     — userAuth (cookie)
  //
  // Strategy: do a fresh login per role inside this group so the
  // setup tokens are never invalidated. k6 stores the cookie from
  // the fresh login in the VU jar and automatically sends it on the
  // very next request — so logout gets a valid token every time.
  // ────────────────────────────────────────────────────────────
  group("logout routes", () => {

    // ── Admin: fresh login → logout (k6 jar carries the cookie)
    http.post(
      `${BASE_URL}/admin/login`,
      JSON.stringify(ADMIN_CREDS),
      reqParams(null, "admin-fresh-login-for-logout")
    );
    const adminLogoutRes = http.post(
      `${BASE_URL}/admin/logout`,
      null,
      { headers: JSON_HEADERS, tags: { name: "admin-logout" } }
    );
    authLatency.add(adminLogoutRes.timings.duration);
    const adminLogoutOk = check(adminLogoutRes, {
      "admin logout: status 200":   (r) => r.status === 200,
      "admin logout: success true": (r) => safeJson(r).success === true,
    });
    errorRate.add(!adminLogoutOk);

    // ── Teacher: fresh login → logout
    http.post(
      `${BASE_URL}/teachers/login`,
      JSON.stringify(TEACHER_CREDS),
      reqParams(null, "teacher-fresh-login-for-logout")
    );
    const teacherLogoutRes = http.post(
      `${BASE_URL}/teachers/logout`,
      null,
      { headers: JSON_HEADERS, tags: { name: "teacher-logout" } }
    );
    authLatency.add(teacherLogoutRes.timings.duration);
    const teacherLogoutOk = check(teacherLogoutRes, {
      "teacher logout: status 200":   (r) => r.status === 200,
      "teacher logout: success true": (r) => safeJson(r).success === true,
    });
    errorRate.add(!teacherLogoutOk);

    // ── User: fresh login → logout
    http.post(
      `${BASE_URL}/user/login`,
      JSON.stringify(USER_CREDS),
      reqParams(null, "user-fresh-login-for-logout")
    );
    const userLogoutRes = http.post(
      `${BASE_URL}/user/logout`,
      null,
      { headers: JSON_HEADERS, tags: { name: "user-logout" } }
    );
    authLatency.add(userLogoutRes.timings.duration);
    const userLogoutOk = check(userLogoutRes, {
      "user logout: status 200":   (r) => r.status === 200,
      "user logout: success true": (r) => safeJson(r).success === true,
    });
    errorRate.add(!userLogoutOk);

    sleep(0.5);
  });

  // Realistic think time between iterations
  sleep(Math.random() * 1 + 0.5); // random 0.5–1.5s
}

// ── TEARDOWN: runs once after the test ────────────────────────
export function teardown(data) {
  const { adminToken, teacherToken, userToken } = data;
  const missing = [
    !adminToken   && "admin",
    !teacherToken && "teacher",
    !userToken    && "user",
  ].filter(Boolean);

  if (missing.length === 0) {
    console.log("✅  Test complete. All three role tokens were valid throughout.");
  } else {
    console.warn(`⚠️  Test complete. Missing setup tokens for: ${missing.join(", ")}.`);
    console.warn("   Protected routes for those roles were skipped.");
  }
}