import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

function getClientIp(req) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

/**
 * Fixed-window rate limiter.
 * Returns `null` when allowed, or a NextResponse(429) when blocked.
 */
export async function rateLimit(req, {
  name,
  limit,
  windowMs,
}) {
  const redis = getRedis();
  if (!redis) return null;

  const ip = getClientIp(req);
  const windowId = Math.floor(Date.now() / windowMs);
  const key = `rl:${name}:${ip}:${windowId}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000) + 1);
  }

  if (count <= limit) return null;

  const resetInSeconds = Math.ceil(((windowId + 1) * windowMs - Date.now()) / 1000);
  return NextResponse.json(
    {
      error: 'Rate limited',
      limit,
      windowMs,
      retryAfterSeconds: Math.max(1, resetInSeconds),
    },
    {
      status: 429,
      headers: {
        'retry-after': String(Math.max(1, resetInSeconds)),
      },
    },
  );
}

