'use client';

import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '@/lib/api';

export default function TopBanner() {
  const [top, setTop] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard('weekly')
      .then((rows) => { if (!cancelled) setTop((rows || []).slice(0, 3)); })
      .catch(() => { if (!cancelled) setTop([]); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className="block w-full flex-shrink-0 relative z-20 text-white border-b"
      style={{
        background: 'var(--color-black)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
      role="region"
      aria-label="Top 3 this week"
    >
      <div
        className="max-w-2xl mx-auto w-full px-5 sm:px-8 py-2 sm:py-2.5 flex items-center justify-center gap-3 text-[12px] sm:text-[13px]"
        style={{ paddingTop: 'max(0.55rem, env(safe-area-inset-top, 0px))' }}
      >
        <span aria-hidden className="checker w-4 h-4 rounded-[2px] flex-shrink-0 opacity-90" />
        <span
          className="font-bold uppercase tracking-[0.22em] text-[10px] sm:text-[11px] flex-shrink-0"
          style={{ color: 'var(--color-yellow)' }}
        >
          Tour Leaders
        </span>
        <span aria-hidden style={{ color: 'rgba(245,241,232,0.30)' }}>·</span>

        {top === null ? (
          <span className="opacity-60 text-[11px]">Loading…</span>
        ) : top.length === 0 ? (
          <span className="opacity-75 font-medium text-[11px] sm:text-[12px]">Be the first to vote 👍</span>
        ) : (
          <div className="flex items-center justify-center gap-3 sm:gap-4 whitespace-nowrap min-w-0 overflow-x-auto scrollbar-hide">
            {top.map((item, i) => (
              <span key={item.id} className="inline-flex items-center gap-1.5 font-medium text-[11px] sm:text-[12px]">
                <span className="font-bold opacity-80" style={{ color: 'var(--color-yellow)' }}>#{i + 1}</span>
                <span className="opacity-95 truncate max-w-[10rem] sm:max-w-[14rem]">{item.text}</span>
                <span className="opacity-60 tabular-nums">+{item.votes}</span>
                {i < top.length - 1 && <span aria-hidden className="opacity-25 ml-2">·</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
