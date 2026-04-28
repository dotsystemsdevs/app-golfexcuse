import { renderHomeOg, OG_SIZE } from '@/lib/og';

export const runtime = 'edge';
export const alt = 'Excuse Caddie — Random Golf Excuse Generator';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  return renderHomeOg();
}
