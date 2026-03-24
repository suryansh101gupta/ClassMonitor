import { client } from "../config/redis.js";

// cacheMiddleware(key, ttl)
//   key — the Redis key to store/retrieve the cached response
//   ttl — time to live in seconds (e.g. 60 = cache for 60 seconds)
//
// Usage in route file:
//   import { cacheMiddleware } from "../middleware/cache_middleware.js";
//   router.get("/get-all-subjects", adminAuth, cacheMiddleware("all_subjects", 60), getAllSubjects);

const cacheMiddleware = (key, ttl) => async (req, res, next) => {
  // If Redis is not connected, skip caching and go straight to controller
  if (!client.isOpen) {
    console.warn(`[CACHE] Redis not connected — skipping cache for key: ${key}`);
    return next();
  }

  try {
    // ── CHECK CACHE ───────────────────────────────────────────
    const cached = await client.get(key);

    if (cached) {
      // Cache HIT — return immediately without touching MongoDB
      console.log(`[CACHE] HIT — ${key}`);
      return res.status(200).json(JSON.parse(cached));
    }

    // Cache MISS — intercept res.json to store response in Redis
    console.log(`[CACHE] MISS — ${key}, fetching from DB`);

    // ── INTERCEPT res.json ────────────────────────────────────
    // Save original res.json so we can call it after caching
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        try {
          await client.setEx(key, ttl, JSON.stringify(body));
          console.log(`[CACHE] SET — ${key} (TTL: ${ttl}s)`);
        } catch (err) {
          // Caching failed — still send the response, don't block the user
          console.error(`[CACHE] Failed to set key ${key}:`, err.message);
        }
      }

      // Send the original response
      return originalJson(body);
    };

    next();

  } catch (err) {
    // Redis error — skip caching entirely, don't break the request
    console.error(`[CACHE] Error for key ${key}:`, err.message);
    next();
  }
};

// invalidateCache(key)
//   key — the Redis key to delete from cache
//   Use this after successful create/update/delete operations
//
// Usage in controller:
//   import { invalidateCache } from "../middleware/reedis_middleware.js";
//   await invalidateCache("all_subjects");

const invalidateCache = async (key) => {
  if (!client.isOpen) {
    console.warn(`[CACHE] Redis not connected — skipping cache invalidation for key: ${key}`);
    return;
  }

  try {
    await client.del(key);
    console.log(`[CACHE] INVALIDATED — ${key}`);
  } catch (err) {
    console.error(`[CACHE] Failed to invalidate key ${key}:`, err.message);
  }
};

export { cacheMiddleware, invalidateCache };