import "server-only";

import type { RateLimitPolicy } from "./config";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // Seconds until reset
};

// In-Memory store for development fallback
type InMemBucket = {
  count: number;
  resetAt: number; // Epoch timestamp (ms)
};
const inMemoryStore = new Map<string, InMemBucket>();

/**
 * Get the rate limit key format
 */
function getRateLimitKey(ip: string, policy: RateLimitPolicy): string {
  // Normalize IP
  const cleanIp = ip.replace(/[^a-zA-Z0-9.:]/g, "").slice(0, 50);
  return `rate_limit:${policy.key}:${cleanIp}`;
}

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
  const response = await fetch(`${cleanUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["TTL", key],
    ]),
  });

  if (!response.ok) {
    throw new Error(`Upstash returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const count = Number(data[0]?.result ?? 0);
  let ttl = Number(data[1]?.result ?? 0);

  if (ttl === -1) {
    // Key has no expiry (just created). Apply expire.
    await fetch(`${cleanUrl}/expire/${key}/${windowSeconds}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    ttl = windowSeconds;
  }

  const allowed = count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - count),
    retryAfter: allowed ? 0 : (ttl > 0 ? ttl : windowSeconds),
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
  const response = await fetch(`${cleanUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["GET", key],
      ["TTL", key],
    ]),
  });

  if (!response.ok) {
    throw new Error(`Upstash returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const count = Number(data[0]?.result ?? 0);
  const ttl = Number(data[1]?.result ?? 0);

  const allowed = count < limit;
  return {
    allowed,
    remaining: Math.max(0, limit - count),
    retryAfter: allowed ? 0 : (ttl > 0 ? ttl : windowSeconds),
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
    .select("count, reset_at")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }

  const now = Date.now();
  const resetAt = new Date(data.reset_at).getTime();
  if (now >= resetAt) {
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }

  const count = Number(data.count);
  const allowed = count < limit;
  const retryAfter = allowed ? 0 : Math.ceil((resetAt - now) / 1000);

  return {
    allowed,
    remaining: Math.max(0, limit - count),
    retryAfter,
  };
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

  if (!bucket || now >= bucket.resetAt) {
    bucket = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    inMemoryStore.set(key, bucket);
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;
  const remaining = Math.max(0, limit - bucket.count);
  const retryAfter = allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000);

  return { allowed, remaining, retryAfter };
}

function checkInMemory(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const bucket = inMemoryStore.get(key);

  if (!bucket || now >= bucket.resetAt) {
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }

  const allowed = bucket.count < limit;
  const remaining = Math.max(0, limit - bucket.count);
  const retryAfter = allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000);

  return { allowed, remaining, retryAfter };
}

function resetInMemory(key: string): void {
  inMemoryStore.delete(key);
}

/**
 * Primary Consume Hook: Decrements rate limit bucket and returns status
 */
export async function consumeRateLimit(
  ip: string,
  policy: RateLimitPolicy
): Promise<RateLimitResult> {
  const key = getRateLimitKey(ip, policy);
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  // 1. Try Upstash Redis
  if (upstashUrl && upstashToken) {
    try {
      return await consumeUpstash(key, policy.limit, policy.windowSeconds, upstashUrl, upstashToken);
    } catch (err: any) {
      console.warn(`[SECURITY] Upstash Redis consume failed: ${err?.message || err}. Falling back.`);
    }
  }

  // 2. Try Supabase DB
  try {
    return await consumeDatabase(key, policy.limit, policy.windowSeconds);
  } catch (err: any) {
    console.warn(`[SECURITY] Database rate limit consume failed (migrated?): ${err?.message || err}. Falling back to in-memory.`);
  }

  // 3. Fallback to In-Memory
  return consumeInMemory(key, policy.limit, policy.windowSeconds);
}

/**
 * Check Hook: Inspects rate limit state without incrementing/consuming a token
 */
export async function checkRateLimit(
  ip: string,
  policy: RateLimitPolicy
): Promise<RateLimitResult> {
  const key = getRateLimitKey(ip, policy);
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (upstashUrl && upstashToken) {
    try {
      return await checkUpstash(key, policy.limit, policy.windowSeconds, upstashUrl, upstashToken);
    } catch (err: any) {
      console.warn(`[SECURITY] Upstash Redis check failed: ${err?.message || err}. Falling back.`);
    }
  }

  try {
    return await checkDatabase(key, policy.limit, policy.windowSeconds);
  } catch (err: any) {
    // Ignore and fallback
  }

  return checkInMemory(key, policy.limit, policy.windowSeconds);
}

/**
 * Reset Hook: Completely clears a rate limit bucket
 */
export async function resetRateLimit(ip: string, policy: RateLimitPolicy): Promise<void> {
  const key = getRateLimitKey(ip, policy);
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (upstashUrl && upstashToken) {
    try {
      await resetUpstash(key, upstashUrl, upstashToken);
      return;
    } catch (err: any) {
      // Ignore and fallback
    }
  }

  try {
    await resetDatabase(key);
  } catch (err: any) {
    // Ignore and fallback
  }

  resetInMemory(key);
}
