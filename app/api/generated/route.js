import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'stats:total_generated';

export async function GET(req) {
  const limited = await rateLimit(req, { name: 'generated_get', limit: 120, windowMs: 60_000 });
  if (limited) return limited;
  const redis = getRedis();
  if (!redis) return NextResponse.json({ total: 0, persisted: false });
  const raw = await redis.get(KEY);
  return NextResponse.json({ total: Number(raw) || 0, persisted: true });
}

export async function POST(req) {
  const limited = await rateLimit(req, { name: 'generated_post', limit: 50, windowMs: 60_000 });
  if (limited) return limited;
  const redis = getRedis();
  if (!redis) return NextResponse.json({ total: 0, persisted: false });
  const total = await redis.incr(KEY);
  return NextResponse.json({ total, persisted: true });
}
