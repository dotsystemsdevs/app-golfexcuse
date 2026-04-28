import { renderExcuseOg, OG_SIZE } from '@/lib/og';
import { EXCUSE_COUNT } from '@/lib/excuses';

export const runtime = 'edge';
export const alt = 'A golf excuse from Excuse Caddie';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateImageMetadata() {
  return Array.from({ length: EXCUSE_COUNT }, (_, i) => ({
    id: String(i + 1),
    alt: `Golf excuse #${i + 1} — Excuse Caddie`,
    contentType: 'image/png',
    size: OG_SIZE,
  }));
}

export default async function Image({ params }) {
  const n = Number.parseInt(String(params?.num ?? '').trim(), 10);
  return renderExcuseOg(n);
}
