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
        className="w-full px-4 sm:px-8 py-2 sm:py-2.5 flex items-center justify-center text-[12px] sm:text-[13px] min-w-0"
        style={{ paddingTop: 'max(0.55rem, env(safe-area-inset-top, 0px))' }}
      >
        {top === null ? (
          <span className="opacity-60 text-[11px]">Loading…</span>
        ) : top.length === 0 ? (
          <span className="inline-flex items-center gap-1.5 opacity-75 font-medium text-[11px] sm:text-[12px]">
            <ThumbsUpInline />
            Be the first to vote
          </span>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto scrollbar-hide">
            <div className="inline-flex items-center justify-center gap-3 sm:gap-4 whitespace-nowrap px-2">
              {top.map((item, i) => (
                <span key={item.id} className="inline-flex items-center gap-2 font-medium text-[11px] sm:text-[12px] min-w-0">
                  <span className="font-bold opacity-85" style={{ color: 'var(--color-yellow)' }}>#{i + 1}</span>
                  <span className="opacity-95 truncate max-w-[10rem] sm:max-w-[14rem] md:max-w-[18rem]">{item.text}</span>
                  <span className="inline-flex items-center gap-1 opacity-70 tabular-nums">
                    <ThumbsUpInline />
                    {item.votes}
                  </span>
                  {i < top.length - 1 && <span aria-hidden className="opacity-25 mx-1.5">·</span>}
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
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ transform: 'translateY(0.5px)' }}>
      <path d="M2 11v9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1zm20.5-1.5h-6.65l.6-3.16c.04-.21.06-.42.06-.64 0-.4-.16-.78-.44-1.06L15.17 4l-6.59 6.59c-.36.36-.58.86-.58 1.41v8c0 1.1.9 2 2 2h8.51c.71 0 1.37-.39 1.71-1.02l3.18-7.42c.07-.16.1-.34.1-.52v-1.96c0-.83-.67-1.5-1.5-1.5z" />
    </svg>
  );
}
