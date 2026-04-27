import { NextResponse } from 'next/server';
import { getRedis, KEYS, TTL } from '@/lib/redis';
import { getExcuseText } from '@/lib/excuse-ids';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const limited = await rateLimit(req, { name: 'vote_post', limit: 50, windowMs: 60_000 });
  if (limited) return limited;
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { excuseId, deviceId, direction } = body || {};
  if (!excuseId || !deviceId) {
    return NextResponse.json({ error: 'Missing excuseId or deviceId' }, { status: 400 });
  }
  if (direction !== 'up' && direction !== 'down') {
    return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });
  }
  if (!getExcuseText(excuseId)) {
    return NextResponse.json({ error: 'Unknown excuse' }, { status: 404 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ ok: true, persisted: false, vote: direction });
  }

  const voteKey = KEYS.voters(excuseId);
  const previous = await redis.hget(voteKey, deviceId);

  let delta = 0;
  let nextVote = direction;

  if (!previous) {
    await redis.hset(voteKey, { [deviceId]: direction });
    delta = direction === 'up' ? 1 : -1;
  } else if (previous === direction) {
    await redis.hdel(voteKey, deviceId);
    delta = direction === 'up' ? -1 : 1;
    nextVote = null;
  } else {
    await redis.hset(voteKey, { [deviceId]: direction });
    delta = direction === 'up' ? 2 : -2;
  }

  if (delta !== 0) {
    const weeklyKey = KEYS.weekly();
    const monthlyKey = KEYS.monthly();
    await Promise.all([
      redis.zincrby(KEYS.all, delta, excuseId),
      redis.zincrby(weeklyKey, delta, excuseId),
      redis.zincrby(monthlyKey, delta, excuseId),
      redis.expire(weeklyKey, TTL.weekly),
      redis.expire(monthlyKey, TTL.monthly),
      redis.expire(voteKey, TTL.voters),
    ]);
  }

  return NextResponse.json({ ok: true, persisted: true, vote: nextVote });
}
