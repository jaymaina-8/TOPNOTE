import "server-only";

import { headers, cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { RateLimitPolicy } from "@/lib/rate-limit/config";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // Seconds until reset
};

export type RateLimitContext = {
  ip: string;
  sessionId?: string;
  userAgent?: string;
  fingerprint?: string;
};

// In-Memory store for development fallback
type InMemBucket = {
  tokens: number;
  lastRefilled: number; // Epoch timestamp (ms)
};
const inMemoryStore = new Map<string, InMemBucket>();

/**
 * Extract fingerprint context from request or Next.js headers/cookies context
 */
export async function getRateLimitContext(req?: NextRequest): Promise<RateLimitContext> {
  if (req) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip")?.trim() ||
               "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;
    const sessionId = req.cookies.get("session_id")?.value;
    const fingerprint = req.cookies.get("visitor_id")?.value;
    return { ip, sessionId, userAgent, fingerprint };
  }

  try {
    const reqHeaders = await headers();
    const reqCookies = await cookies();
    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               reqHeaders.get("x-real-ip")?.trim() ||
               "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || undefined;
    const sessionId = reqCookies.get("session_id")?.value;
    const fingerprint = reqCookies.get("visitor_id")?.value;
    return { ip, sessionId, userAgent, fingerprint };
  } catch {
    return { ip: "127.0.0.1" };
  }
}

/**
 * Get the rate limit key using the SHA-256 hashed fingerprint context
 */
async function getRateLimitKey(ctx: RateLimitContext, policy: RateLimitPolicy): Promise<string> {
  const parts = [
    ctx.ip,
    ctx.sessionId || "",
    ctx.userAgent || "",
    ctx.fingerprint || "",
  ];
  const input = parts.filter(Boolean).join("|");

  // Hash the combined string using the Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return `rate_limit:${policy.key}:${hashHex}`;
}

const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local refill_rate = limit / window
local max_tokens = limit

local data = redis.call('HMGET', key, 'tokens', 'last_refilled')
local tokens = tonumber(data[1])
local last_refilled = tonumber(data[2])

if not tokens then
  tokens = max_tokens - 1.0
  last_refilled = now
else
  local elapsed = math.max(0.0, now - last_refilled)
  tokens = math.min(max_tokens, tokens + elapsed * refill_rate)
  last_refilled = now
end

local allowed = 0
if tokens >= 1.0 then
  tokens = tokens - 1.0
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tostring(tokens), 'last_refilled', tostring(last_refilled))
redis.call('EXPIRE', key, math.ceil(window))

local remaining = math.floor(tokens)
local retry_after = 0
if allowed == 0 then
  retry_after = math.ceil((1.0 - tokens) / refill_rate)
end

return {allowed, remaining, retry_after}
`;

const CHECK_TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local refill_rate = limit / window
local max_tokens = limit

local data = redis.call('HMGET', key, 'tokens', 'last_refilled')
local tokens = tonumber(data[1])
local last_refilled = tonumber(data[2])

if not tokens then
  return {1, limit, 0}
end

local elapsed = math.max(0.0, now - last_refilled)
tokens = math.min(max_tokens, tokens + elapsed * refill_rate)

local allowed = 0
if tokens >= 1.0 then
  allowed = 1
end

local remaining = math.floor(tokens)
local retry_after = 0
if allowed == 0 then
  retry_after = math.ceil((1.0 - tokens) / refill_rate)
end

return {allowed, remaining, retry_after}
`;

/**
 * Upstash REST API Rate Limiter
 */
async function consumeUpstash(
  key: string,
  limit: number,
  windowSeconds: number,
  url: string,
  token: string
): Promise<RateLimitResult> {
  const cleanUrl = url.replace(/\/$/, "");
  const now = Date.now() / 1000;
  const response = await fetch(`${cleanUrl}/eval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      script: TOKEN_BUCKET_LUA,
      keys: [key],
      args: [limit.toString(), windowSeconds.toString(), now.toString()],
    }),
  });

  if (!response.ok) {
    throw new Error(`Upstash returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data.result;
  if (!Array.isArray(result) || result.length < 3) {
    throw new Error("Upstash eval returned invalid result structure");
  }

  return {
    allowed: Number(result[0]) === 1,
    remaining: Number(result[1]),
    retryAfter: Number(result[2]),
  };
}

async function checkUpstash(
  key: string,
  limit: number,
  windowSeconds: number,
  url: string,
  token: string
): Promise<RateLimitResult> {
  const cleanUrl = url.replace(/\/$/, "");
  const now = Date.now() / 1000;
  const response = await fetch(`${cleanUrl}/eval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      script: CHECK_TOKEN_BUCKET_LUA,
      keys: [key],
      args: [limit.toString(), windowSeconds.toString(), now.toString()],
    }),
  });

  if (!response.ok) {
    throw new Error(`Upstash returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data.result;
  if (!Array.isArray(result) || result.length < 3) {
    throw new Error("Upstash eval returned invalid result structure");
  }

  return {
    allowed: Number(result[0]) === 1,
    remaining: Number(result[1]),
    retryAfter: Number(result[2]),
  };
}

async function resetUpstash(key: string, url: string, token: string): Promise<void> {
  const cleanUrl = url.replace(/\/$/, "");
  await fetch(`${cleanUrl}/del/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Database RPC Rate Limiter
 */
async function consumeDatabase(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const admin = createServiceRoleClient();
  if (!admin) throw new Error("Service role client is unconfigured");

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error || !data || data.length === 0) {
    throw new Error(error?.message || "DB RPC returned empty result");
  }

  const result = data[0];
  return {
    allowed: Boolean(result.allowed),
    remaining: Number(result.remaining),
    retryAfter: Number(result.retry_after),
  };
}

async function checkDatabase(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const admin = createServiceRoleClient();
  if (!admin) throw new Error("Service role client is unconfigured");

  const { data, error } = await admin
    .from("rate_limits")
    .select("tokens, last_refilled_at")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }

  const now = Date.now();
  const lastRefilled = new Date(data.last_refilled_at || now).getTime();
  const elapsed = Math.max(0, now - lastRefilled);
  const refillRate = limit / (windowSeconds * 1000);
  const tokens = Math.min(limit, (Number(data.tokens) || 0) + elapsed * refillRate);

  const allowed = tokens >= 1;
  const remaining = Math.floor(tokens);
  const retryAfter = allowed ? 0 : Math.ceil((1 - tokens) / (refillRate * 1000));

  return { allowed, remaining, retryAfter };
}

async function resetDatabase(key: string): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) return;
  await admin.from("rate_limits").delete().eq("key", key);
}

/**
 * In-Memory Fallback
 */
function consumeInMemory(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  let bucket = inMemoryStore.get(key);
  const refillRate = limit / (windowSeconds * 1000);

  if (!bucket) {
    bucket = {
      tokens: limit - 1,
      lastRefilled: now,
    };
    inMemoryStore.set(key, bucket);
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  const elapsed = now - bucket.lastRefilled;
  let newTokens = bucket.tokens;
  if (elapsed > 0) {
    newTokens = Math.min(limit, bucket.tokens + elapsed * refillRate);
    bucket.lastRefilled = now;
  }

  let allowed = false;
  if (newTokens >= 1) {
    newTokens -= 1;
    allowed = true;
  }

  bucket.tokens = newTokens;
  const remaining = Math.floor(newTokens);
  let retryAfter = 0;
  if (!allowed) {
    retryAfter = Math.ceil((1 - newTokens) / (refillRate * 1000));
  }

  return { allowed, remaining, retryAfter };
}

function checkInMemory(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const bucket = inMemoryStore.get(key);
  const refillRate = limit / (windowSeconds * 1000);

  if (!bucket) {
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }

  const elapsed = now - bucket.lastRefilled;
  let newTokens = bucket.tokens;
  if (elapsed > 0) {
    newTokens = Math.min(limit, bucket.tokens + elapsed * refillRate);
  }

  const allowed = newTokens >= 1;
  const remaining = Math.floor(newTokens);
  let retryAfter = 0;
  if (!allowed) {
    retryAfter = Math.ceil((1 - newTokens) / (refillRate * 1000));
  }

  return { allowed, remaining, retryAfter };
}

function resetInMemory(key: string): void {
  inMemoryStore.delete(key);
}

/**
 * Primary Consume Hook: Decrements rate limit bucket and returns status
 */
export async function consumeRateLimit(
  ipOrCtx: string | RateLimitContext,
  policy: RateLimitPolicy
): Promise<RateLimitResult> {
  const ctx = typeof ipOrCtx === "string" ? { ip: ipOrCtx } : ipOrCtx;
  const key = await getRateLimitKey(ctx, policy);
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  // 1. Try Upstash Redis
  if (upstashUrl && upstashToken) {
    try {
      return await consumeUpstash(key, policy.limit, policy.windowSeconds, upstashUrl, upstashToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[SECURITY_FALLBACK] Upstash Redis consume failed: ${msg}. Falling back to PostgreSQL.`);
    }
  } else {
    console.warn("[SECURITY_FALLBACK] Upstash Redis is unconfigured. Falling back to PostgreSQL.");
  }

  // 2. Try Supabase DB
  try {
    return await consumeDatabase(key, policy.limit, policy.windowSeconds);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[SECURITY_FALLBACK] Database rate limit consume failed: ${msg}. Falling back to in-memory.`);
  }

  // 3. Fallback to In-Memory
  return consumeInMemory(key, policy.limit, policy.windowSeconds);
}

/**
 * Check Hook: Inspects rate limit state without incrementing/consuming a token
 */
export async function checkRateLimit(
  ipOrCtx: string | RateLimitContext,
  policy: RateLimitPolicy
): Promise<RateLimitResult> {
  const ctx = typeof ipOrCtx === "string" ? { ip: ipOrCtx } : ipOrCtx;
  const key = await getRateLimitKey(ctx, policy);
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (upstashUrl && upstashToken) {
    try {
      return await checkUpstash(key, policy.limit, policy.windowSeconds, upstashUrl, upstashToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[SECURITY_FALLBACK] Upstash Redis check failed: ${msg}. Falling back to PostgreSQL.`);
    }
  }

  try {
    return await checkDatabase(key, policy.limit, policy.windowSeconds);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[SECURITY_FALLBACK] Database rate limit check failed: ${msg}. Falling back to in-memory.`);
  }

  return checkInMemory(key, policy.limit, policy.windowSeconds);
}

/**
 * Reset Hook: Completely clears a rate limit bucket
 */
export async function resetRateLimit(ipOrCtx: string | RateLimitContext, policy: RateLimitPolicy): Promise<void> {
  const ctx = typeof ipOrCtx === "string" ? { ip: ipOrCtx } : ipOrCtx;
  const key = await getRateLimitKey(ctx, policy);
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (upstashUrl && upstashToken) {
    try {
      await resetUpstash(key, upstashUrl, upstashToken);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[SECURITY_FALLBACK] Upstash Redis reset failed: ${msg}. Falling back to PostgreSQL.`);
    }
  }

  try {
    await resetDatabase(key);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[SECURITY_FALLBACK] Database rate limit reset failed: ${msg}. Falling back to in-memory.`);
  }

  resetInMemory(key);
}

export function getFriendlyRateLimitMessage(retryAfter: number): string {
  if (retryAfter < 60) {
    const sec = Math.max(1, retryAfter);
    return `You're submitting requests very quickly. Please wait about ${sec} seconds before trying again.`;
  }
  const minutes = Math.ceil(retryAfter / 60);
  if (minutes < 60) {
    return `Too many requests. Please try again in approximately ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
  }
  const hours = Math.ceil(minutes / 60);
  return `Too many requests. Please try again in approximately ${hours} ${hours === 1 ? "hour" : "hours"}.`;
}
