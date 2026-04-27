import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const limited = await rateLimit(req, { name: 'sounds_get', limit: 120, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const dir = join(process.cwd(), 'public', 'sounds');
    const files = readdirSync(dir)
      .filter((f) => /\.(mp3|wav|ogg|m4a|aac)$/i.test(f))
      .map((f) => `/sounds/${f}`);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
