import { renderExcuseOg, OG_SIZE } from '@/lib/og';

export const runtime = 'edge';
export const alt = 'A golf excuse from Excuse Caddie';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image({ params }) {
  const n = Number.parseInt(String(params?.num ?? '').trim(), 10);
  return renderExcuseOg(n);
}
