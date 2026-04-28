import { ImageResponse } from 'next/og';
import { CATEGORY_KEYS, CATEGORY_META, getExcusesByTag, EXCUSE_COUNT } from '@/lib/excuses';

export const runtime = 'edge';
export const alt = 'A category of golf excuses from Excuse Caddie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CREAM = '#F5F1E8';
const FAIRWAY_DEEP = '#1F3528';
const FAIRWAY = '#508560';
const YELLOW = '#E8C547';
const INK = '#1A1916';

export default async function Image({ params }) {
  const { category } = await params;
  const safe = CATEGORY_KEYS.includes(category) ? category : CATEGORY_KEYS[0];
  const meta = CATEGORY_META[safe];
  const count = getExcusesByTag(safe).length;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${FAIRWAY_DEEP} 0%, ${FAIRWAY} 100%)`,
          padding: '64px 72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 14, height: 56, background: YELLOW, borderRadius: 4, display: 'flex' }} />
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '0.18em',
              color: CREAM,
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            Excuse Caddie
          </div>
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 22,
              fontWeight: 700,
              color: YELLOW,
              letterSpacing: '0.08em',
              display: 'flex',
            }}
          >
            {count} rulings
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '24px 0',
          }}
        >
          <div
            style={{
              background: CREAM,
              borderRadius: 28,
              padding: '56px 64px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.32)',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#7A6F4F',
                display: 'flex',
              }}
            >
              Category
            </div>
            <div
              style={{
                fontSize: 78,
                fontWeight: 800,
                lineHeight: 1.05,
                color: INK,
                letterSpacing: '-0.02em',
                display: 'flex',
              }}
            >
              {meta.headline}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: CREAM,
            opacity: 0.85,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 600, display: 'flex' }}>
            {EXCUSE_COUNT} ironclad alibis · all free
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: YELLOW,
              display: 'flex',
            }}
          >
            excusecaddie.xyz
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
