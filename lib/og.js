import { ImageResponse } from 'next/og';
import { EXCUSES, EXCUSE_COUNT } from './excuses';

const CREAM = '#F5F1E8';
const FAIRWAY_DEEP = '#1F3528';
const FAIRWAY = '#508560';
const YELLOW = '#E8C547';
const INK = '#1A1916';

export const OG_SIZE = { width: 1200, height: 630 };

function fitFontSize(text) {
  const len = text.length;
  if (len <= 28) return 96;
  if (len <= 50) return 78;
  if (len <= 80) return 64;
  if (len <= 120) return 52;
  return 44;
}

export function renderHomeOg() {
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
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: '0.18em',
              color: CREAM,
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            Excuse Caddie
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
              gap: 18,
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
              The Random Golf Excuse Generator
            </div>
            <div
              style={{
                fontSize: 76,
                fontWeight: 800,
                lineHeight: 1.05,
                color: INK,
                letterSpacing: '-0.02em',
                display: 'flex',
              }}
            >
              Tap once. Blame the wind.
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
          <div style={{ fontSize: 24, fontWeight: 600, display: 'flex' }}>
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
    { ...OG_SIZE }
  );
}

export function renderExcuseOg(num) {
  const safe = Number.isFinite(num) && num >= 1 && num <= EXCUSE_COUNT ? num : 1;
  const text = EXCUSES[safe - 1].text;
  const fontSize = fitFontSize(text);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${FAIRWAY_DEEP} 0%, ${FAIRWAY} 100%)`,
          padding: '56px 64px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 12, height: 48, background: YELLOW, borderRadius: 4, display: 'flex' }} />
          <div
            style={{
              fontSize: 26,
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
            #{safe} / {EXCUSE_COUNT}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '20px 0',
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
              Today's Ruling
            </div>
            <div
              style={{
                fontSize,
                fontWeight: 800,
                lineHeight: 1.1,
                color: INK,
                letterSpacing: '-0.02em',
                display: 'flex',
              }}
            >
              "{text}"
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
            Tap the button. Get an ironclad excuse.
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
    { ...OG_SIZE }
  );
}
