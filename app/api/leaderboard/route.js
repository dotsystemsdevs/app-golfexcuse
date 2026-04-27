import { NextResponse } from 'next/server';
import { getRedis, KEYS } from '@/lib/redis';
import { getExcuseText } from '@/lib/excuse-ids';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = 20;

export async function GET(req) {
  const limited = await rateLimit(req, { name: 'leaderboard_get', limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || 'all';

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ items: [], persisted: false });
  }

  const key =
    range === 'weekly'
      ? KEYS.weekly()
      : range === 'monthly'
        ? KEYS.monthly()
        : KEYS.all;

  const raw = await redis.zrange(key, 0, LIMIT - 1, {
    rev: true,
    withScores: true,
  });

  const items = [];
  for (let i = 0; i < raw.length; i += 2) {
    const id = String(raw[i]);
    const votes = Number(raw[i + 1]);
    const text = getExcuseText(id);
    if (!text) continue;
    items.push({ id, text, votes });
  }

  return NextResponse.json({ items, persisted: true });
}
