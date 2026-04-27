'use client';

import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '@/lib/api';

export default function TopBanner() {
  const [top, setTop] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard('all')
      .then((rows) => { if (!cancelled) setTop((rows || []).slice(0, 3)); })
      .catch(() => { if (!cancelled) setTop([]); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className="block w-full flex-shrink-0 relative z-20 text-white border-b"
      style={{
        background: 'var(--color-fairway-deep)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
      role="region"
      aria-label="Top 3 all-time"
    >
      <div
        className="w-full px-4 sm:px-8 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 text-[12px] sm:text-[13px] min-w-0"
        style={{ paddingTop: 'max(0.55rem, env(safe-area-inset-top, 0px))' }}
      >
        <span
          className="font-bold uppercase tracking-[0.22em] text-[10px] sm:text-[11px] flex-shrink-0"
          style={{ color: 'var(--color-yellow)' }}
        >
          Tour Leaders
        </span>
        <span aria-hidden style={{ color: 'rgba(255,255,255,0.30)' }}>·</span>
        <span className="font-medium uppercase tracking-wider text-[10px] flex-shrink-0 opacity-60">
          All-time
        </span>
        <span aria-hidden style={{ color: 'rgba(255,255,255,0.30)' }}>·</span>

        {top === null ? (
          <span className="opacity-60 text-[11px]">Loading…</span>
        ) : top.length === 0 ? (
          <span className="inline-flex items-center gap-1.5 opacity-75 font-medium text-[11px] sm:text-[12px]">
            <ThumbsUpInline />
            Be the first to vote
          </span>
        ) : (
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            <div className="inline-flex items-center gap-3 sm:gap-4 whitespace-nowrap pr-6">
            {top.map((item, i) => (
              <span key={item.id} className="inline-flex items-center gap-1.5 font-medium text-[11px] sm:text-[12px] min-w-0">
                <span className="font-bold opacity-80" style={{ color: 'var(--color-yellow)' }}>#{i + 1}</span>
                <span className="opacity-95 truncate max-w-[12rem] sm:max-w-[18rem] md:max-w-[24rem]">{item.text}</span>
                <span className="opacity-60 tabular-nums">+{item.votes}</span>
                {i < top.length - 1 && <span aria-hidden className="opacity-25 mx-2">·</span>}
              </span>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThumbsUpInline() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2 11v9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1zm20.5-1.5h-6.65l.6-3.16c.04-.21.06-.42.06-.64 0-.4-.16-.78-.44-1.06L15.17 4l-6.59 6.59c-.36.36-.58.86-.58 1.41v8c0 1.1.9 2 2 2h8.51c.71 0 1.37-.39 1.71-1.02l3.18-7.42c.07-.16.1-.34.1-.52v-1.96c0-.83-.67-1.5-1.5-1.5z" />
    </svg>
  );
}
