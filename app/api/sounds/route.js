import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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
