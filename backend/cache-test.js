// ─────────────────────────────────────────────────────────────
//  k6 Cache Test — Redis Cache Hit Ratio Testing
//  Usage:
//    k6 run cache-test.js                         (console output)
//    k6 run --out json=cache-results.json cache-test.js  (save data)
// 
// docker command = docker run -i -v %cd%:/scripts grafana/k6 run /scripts/cache-test.js
//
//  Focus: Test cache hit ratio for Redis-cached endpoints
// ─────────────────────────────────────────────────────────────

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { vu } from "k6/execution";

// ── CONFIG ────────────────────────────────────────────────────
const BASE_URL = "http://host.docker.internal:4000";

// ── STATIC TEST CREDENTIALS ───────────────────────────────────
const ADMIN_CREDS = { email: "testadmin1@mail.com", password: "TESTadmin1@123" };

// ── CACHE TESTING METRICS ─────────────────────────────────────
const cacheHitRate = new Rate("cache_hit_rate");
const cacheMissRate = new Rate("cache_miss_rate");
const cacheHitLatency = new Trend("cache_hit_latency");
const cacheMissLatency = new Trend("cache_miss_latency");
const totalRequests = new Counter("total_cache_requests");
const cacheHits = new Counter("cache_hits");
const cacheMisses = new Counter("cache_misses");

// Track cache state per endpoint
const endpointCacheState = {};

// ── LOAD PROFILE ──────────────────────────────────────────────
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

  thresholds: {
    cache_hit_rate: ["rate>0.6"],     // 60%+ cache hit rate
    cache_hit_latency: ["p(95)<100"], // cache hits under 100ms
    cache_miss_latency: ["p(95)<400"], // cache misses under 400ms
    http_req_duration: ["p(95)<300"], // overall requests under 300ms
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

// Advanced cache hit detection
function detectCacheHit(res, endpoint, iteration) {
  const responseTime = res.timings.duration;
  const isFirstRequest = iteration === 1;
  
  // Initialize endpoint state if not exists
  if (!endpointCacheState[endpoint]) {
    endpointCacheState[endpoint] = {
      firstRequestTime: null,
      cacheHitDetected: false,
    };
  }
  
  const state = endpointCacheState[endpoint];
  
  // Cache hit indicators
  let isCacheHit = false;
  
  // 1. Response time based detection (primary)
  if (responseTime < 100) {
    isCacheHit = true;
  }
  // 2. Subsequent requests to same endpoint
  else if (!isFirstRequest && state.firstRequestTime && responseTime < state.firstRequestTime * 0.5) {
    isCacheHit = true;
  }
  // 3. Check for cache headers (if backend adds them)
  else if (res.headers['x-cache'] === 'HIT' || res.headers['x-redis-cache'] === 'HIT') {
    isCacheHit = true;
  }
  
  // Update state
  if (isFirstRequest) {
    state.firstRequestTime = responseTime;
  }
  
  return isCacheHit;
}

function trackCacheMetrics(res, endpoint, iteration) {
  const isHit = detectCacheHit(res, endpoint, iteration);
  const responseTime = res.timings.duration;
  
  totalRequests.add(1);
  
  if (isHit) {
    cacheHits.add(1);
    cacheHitRate.add(1);
    cacheMissRate.add(0);
    cacheHitLatency.add(responseTime);
    console.log(`🎯 CACHE HIT - ${endpoint}: ${responseTime.toFixed(2)}ms`);
  } else {
    cacheMisses.add(1);
    cacheHitRate.add(0);
    cacheMissRate.add(1);
    cacheMissLatency.add(responseTime);
    console.log(`❌ CACHE MISS - ${endpoint}: ${responseTime.toFixed(2)}ms`);
  }
  
  return isHit;
}

// ── SETUP ───────────────────────────────────────────────────────
export function setup() {
  console.log("🚀 Setting up cache test...");
  
  // Login to get admin token
  const loginRes = http.post(
    `${BASE_URL}/admin/login`,
    JSON.stringify(ADMIN_CREDS),
    { headers: JSON_HEADERS }
  );
  
  if (loginRes.status !== 200) {
    console.error("❌ Setup failed: Admin login failed");
    return null;
  }
  
  const adminToken = loginRes.cookies.token ? loginRes.cookies.token[0].value : null;
  console.log("✅ Setup complete - Admin token obtained");
  
  return { adminToken };
}

// ── MAIN TEST FUNCTION ───────────────────────────────────────────
export default function(data) {
  if (!data || !data.adminToken) {
    console.error("❌ No admin token available");
    return;
  }
  
  const { adminToken } = data;
  const iteration = vu.iterationInScenario + 1;
  
  // ────────────────────────────────────────────────────────────
  // GROUP 1: Subjects Cache Testing
  // ────────────────────────────────────────────────────────────
  group("subjects cache testing", () => {
    console.log(`📚 Testing subjects cache - Iteration ${iteration}`);
    
    // Request 1: Likely cache miss
    const res1 = http.get(
      `${BASE_URL}/subjects/get-all-subjects`,
      reqParams(adminToken, "subjects-req-1")
    );
    
    const hit1 = trackCacheMetrics(res1, "subjects", 1);
    check(res1, {
      "subjects-req-1: status 200": (r) => r.status === 200,
      "subjects-req-1: has data": (r) => Array.isArray(safeJson(r).data),
      "subjects-req-1: response time": (r) => r.timings.duration < 500,
    });
    
    sleep(0.05); // Small delay between requests
    
    // Request 2: Likely cache hit (within 60s TTL)
    const res2 = http.get(
      `${BASE_URL}/subjects/get-all-subjects`,
      reqParams(adminToken, "subjects-req-2")
    );
    
    const hit2 = trackCacheMetrics(res2, "subjects", 2);
    check(res2, {
      "subjects-req-2: status 200": (r) => r.status === 200,
      "subjects-req-2: has data": (r) => Array.isArray(safeJson(r).data),
      "subjects-req-2: faster than first": (r) => hit2 || r.timings.duration < res1.timings.duration,
    });
    
    sleep(0.05);
    
    // Request 3: Should be cache hit
    const res3 = http.get(
      `${BASE_URL}/subjects/get-all-subjects`,
      reqParams(adminToken, "subjects-req-3")
    );
    
    trackCacheMetrics(res3, "subjects", 3);
    check(res3, {
      "subjects-req-3: status 200": (r) => r.status === 200,
      "subjects-req-3: has data": (r) => Array.isArray(safeJson(r).data),
      "subjects-req-3: cache hit": (r) => detectCacheHit(r, "subjects", 3),
    });
  });

  sleep(0.1);

  // ────────────────────────────────────────────────────────────
  // GROUP 2: Teachers Cache Testing
  // ────────────────────────────────────────────────────────────
  group("teachers cache testing", () => {
    console.log(`👨‍🏫 Testing teachers cache - Iteration ${iteration}`);
    
    const res1 = http.get(
      `${BASE_URL}/teachers/get-all-teachers`,
      reqParams(adminToken, "teachers-req-1")
    );
    
    trackCacheMetrics(res1, "teachers", 1);
    check(res1, {
      "teachers-req-1: status 200": (r) => r.status === 200,
      "teachers-req-1: has data": (r) => Array.isArray(safeJson(r).data),
    });
    
    sleep(0.05);
    
    const res2 = http.get(
      `${BASE_URL}/teachers/get-all-teachers`,
      reqParams(adminToken, "teachers-req-2")
    );
    
    trackCacheMetrics(res2, "teachers", 2);
    check(res2, {
      "teachers-req-2: status 200": (r) => r.status === 200,
      "teachers-req-2: has data": (r) => Array.isArray(safeJson(r).data),
    });
  });

  sleep(0.1);

  // ────────────────────────────────────────────────────────────
  // GROUP 3: Classes Cache Testing (Public)
  // ────────────────────────────────────────────────────────────
  group("classes cache testing", () => {
    console.log(`🏫 Testing classes cache - Iteration ${iteration}`);
    
    const res1 = http.get(
      `${BASE_URL}/classes/get-all-classes`,
      reqParams(null, "classes-req-1")
    );
    
    trackCacheMetrics(res1, "classes", 1);
    check(res1, {
      "classes-req-1: status 200": (r) => r.status === 200,
      "classes-req-1: has data": (r) => Array.isArray(safeJson(r).data),
    });
    
    sleep(0.05);
    
    const res2 = http.get(
      `${BASE_URL}/classes/get-all-classes`,
      reqParams(null, "classes-req-2")
    );
    
    trackCacheMetrics(res2, "classes", 2);
    check(res2, {
      "classes-req-2: status 200": (r) => r.status === 200,
      "classes-req-2: has data": (r) => Array.isArray(safeJson(r).data),
    });
  });

  // Realistic think time between iterations
  sleep(Math.random() * 0.5 + 0.2); // 0.2-0.7s
}

// ── TEARDOWN ───────────────────────────────────────────────────
export function teardown(data) {
  console.log("\n📊 CACHE TEST SUMMARY");
  console.log("===================");
  
  const hitRate = cacheHits.value / totalRequests.value;
  const missRate = cacheMisses.value / totalRequests.value;
  
  console.log(`Total Requests: ${totalRequests.value}`);
  console.log(`Cache Hits: ${cacheHits.value} (${(hitRate * 100).toFixed(2)}%)`);
  console.log(`Cache Misses: ${cacheMisses.value} (${(missRate * 100).toFixed(2)}%)`);
  
  if (hitRate > 0.7) {
    console.log("✅ Cache performance: EXCELLENT (>70% hit rate)");
  } else if (hitRate > 0.5) {
    console.log("⚠️  Cache performance: GOOD (>50% hit rate)");
  } else {
    console.log("❌ Cache performance: POOR (<50% hit rate)");
  }
  
  console.log("\nEndpoint Cache States:");
  for (const [endpoint, state] of Object.entries(endpointCacheState)) {
    console.log(`- ${endpoint}: First request ${state.firstRequestTime?.toFixed(2)}ms`);
  }
  
  if (data && data.adminToken) {
    console.log("✅ Test completed successfully");
  } else {
    console.log("❌ Test completed with errors");
  }
}
