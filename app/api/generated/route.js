import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'stats:total_generated';

export async function GET() {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ total: 0, persisted: false });
  const raw = await redis.get(KEY);
  return NextResponse.json({ total: Number(raw) || 0, persisted: true });
}

export async function POST() {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ total: 0, persisted: false });
  const total = await redis.incr(KEY);
  return NextResponse.json({ total, persisted: true });
}
