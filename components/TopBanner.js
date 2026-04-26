'use client';

import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '@/lib/api';

const RANK = ['#b8860b', '#8a8a8e', '#a86b3d'];

export default function TopBanner() {
  const [top, setTop] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard('weekly')
      .then((rows) => {
        if (!cancelled) setTop((rows || []).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setTop([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showEmpty = top && top.length === 0;
  const showChips = top && top.length > 0;
  const loading = top === null;

  return (
    <div
      className="block w-full flex-shrink-0 text-white/90 border-b border-white/10"
      style={{ background: 'var(--color-fairway-deep)' }}
      role="region"
      aria-label="This week, top 3 alibis"
    >
      <div
        className="max-w-xl mx-auto w-full px-5 sm:px-8 min-h-10 sm:min-h-11 flex items-center gap-3 sm:gap-3.5 text-xs sm:text-[0.8rem] py-2.5"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))' }}
      >
        <span className="flex-shrink-0 opacity-90" aria-hidden>
          <FlagIcon />
        </span>
        <span
          className="font-semibold tracking-[0.1em] uppercase text-[0.6rem] sm:text-[0.65rem] flex-shrink-0"
          style={{ color: 'var(--color-tee-yellow-bright)' }}
        >
          <span className="hidden sm:inline">This week</span>
          <span className="sm:hidden">Wk</span>
        </span>
        <span className="text-white/20 select-none" aria-hidden>
          ·
        </span>
        <span className="font-medium text-white/50 text-[0.65rem] sm:text-sm uppercase tracking-wide flex-shrink-0">
          top 3
        </span>

        {loading ? (
          <div className="flex-1 flex justify-end gap-2" aria-hidden>
            <div className="h-1.5 w-16 max-w-full rounded-sm bg-white/5" />
          </div>
        ) : showEmpty ? (
          <p className="flex-1 m-0 min-w-0 pl-0.5 text-right text-white/50 text-[0.7rem] sm:text-[0.8rem] font-medium" role="status">
            <span className="inline sm:hidden">No votes</span>
            <span className="hidden sm:inline">No club votes this week</span>
          </p>
        ) : showChips ? (
          <div
            className="flex-1 flex items-center justify-end gap-1.5 min-w-0 overflow-x-auto scrollbar-hide"
            aria-label="Top alibis this week"
          >
            {top.map((item, i) => (
              <Chip key={item.id} rank={i + 1} text={item.text} votes={item.votes} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Chip({ rank, text, votes }) {
  return (
    <div
      className="flex-1 min-w-0 sm:flex-initial sm:max-w-[9.5rem] flex items-center gap-1 pl-1.5 pr-1.5 py-1 rounded border border-white/8 bg-white/[0.04] max-w-[33%] sm:max-w-none"
      title={`#${rank} — ${text} (+${votes})`}
    >
      <span
        className="flex-shrink-0 w-4 h-4 text-[9px] text-center font-bold leading-4 rounded text-[#0f1a12] flex items-center justify-center"
        style={{ background: RANK[rank - 1] || '#6b7280' }}
        aria-hidden
      >
        {rank}
      </span>
      <span className="min-w-0 text-white/85 text-[0.62rem] sm:text-xs leading-tight truncate">{text}</span>
      <span
        className="flex-shrink-0 text-white/45 text-[0.58rem] sm:text-[0.65rem] font-medium tabular-nums pl-0.5"
        aria-label={`${votes} votes`}
      >
        {votes}
      </span>
    </div>
  );
}

function FlagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <path
        d="M5 20V4l9 3.5-9 3.5"
        fill="var(--color-flag-red)"
        stroke="var(--color-tee-yellow)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <line
        x1="5"
        y1="4"
        x2="5"
        y2="21.5"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
