'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TopBanner from '@/components/TopBanner';
import Footer from '@/components/Footer';
import CountUp from '@/components/CountUp';
import { EXCUSES, getDailyExcuse } from '@/lib/excuses';
import { getExcuseText, pickDifferentWeighted } from '@/lib/utils';
import { getExcuseId } from '@/lib/excuse-ids';
import { fetchGeneratedTotal, trackGenerated, voteForExcuse } from '@/lib/api';
import { playSplash } from '@/lib/sounds';

const FALLBACK_TOTAL = 1247;

const CTA_LABELS = [
  'Take the Mulligan',
  'Another Mulligan',
  'Tee Up Another',
  'One More for the Card',
  'Final Ruling',
];

export default function HomePage() {
  const [excuse, setExcuse] = useState(null);
  const [currentExcuseId, setCurrentExcuseId] = useState(null);
  const [vote, setVote] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [genCount, setGenCount] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(null);

  const seenExcuses = useRef(new Set());
  const dailyExcuse = useMemo(() => getDailyExcuse(EXCUSES), []);
  const cardText = excuse || dailyExcuse.text;

  useEffect(() => {
    setCurrentExcuseId(getExcuseId(dailyExcuse.text));
  }, [dailyExcuse]);

  useEffect(() => {
    fetchGeneratedTotal()
      .then((t) => setGlobalTotal(t > 0 ? t : FALLBACK_TOTAL))
      .catch(() => setGlobalTotal(FALLBACK_TOTAL));
  }, []);

  const handleGenerate = useCallback(() => {
    playSplash();
    const picked = pickDifferentWeighted(EXCUSES, cardText, seenExcuses.current);
    const txt = getExcuseText(picked);
    setExcuse(txt);
    setCurrentExcuseId(getExcuseId(txt));
    setVote(null);
    setHasGenerated(true);
    setGenCount((c) => c + 1);
    setGlobalTotal((cur) => (cur == null ? cur : cur + 1));
    trackGenerated().then((t) => {
      if (typeof t === 'number' && t > 0) setGlobalTotal(t);
    });
  }, [cardText]);

  const handleVote = useCallback(async (direction) => {
    setVote((prev) => (prev === direction ? null : direction));
    if (currentExcuseId) {
      try {
        const res = await voteForExcuse(currentExcuseId, direction);
        if (res && 'vote' in res) setVote(res.vote);
      } catch {}
    }
  }, [currentExcuseId]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${cardText}" — my official ruling on that round.`)}&url=${encodeURIComponent(baseUrl)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}&quote=${encodeURIComponent(`"${cardText}"`)}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`"${cardText}" — Excuse Caddie ${baseUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }, [cardText, baseUrl]);

  const ctaLabel = !hasGenerated ? CTA_LABELS[0] : CTA_LABELS[Math.min(genCount, CTA_LABELS.length - 1)];

  return (
    <main className="relative flex h-dvh max-h-dvh overflow-hidden flex-col" id="main">
      <a href="#excuse" className="skip-link">Skip to excuse</a>
      <TopBanner />

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-5 py-4 sm:py-6 max-w-2xl mx-auto w-full">
        {/* Wordmark + race-rule */}
        <h1
          className="text-[2rem] sm:text-[2.6rem] lg:text-[3rem] leading-[0.95] tracking-[-0.02em] text-center inline-flex items-center gap-2.5 sm:gap-3"
          style={{ fontFamily: 'var(--font-brand)', color: 'var(--color-cream)' }}
        >
          <span aria-hidden className="text-[0.85em] leading-none">⛳</span>
          <span>Excuse Caddie</span>
        </h1>
        <span aria-hidden className="race-rule mt-3 sm:mt-3.5" />

        {/* Counter — scoreboard pill */}
        <div
          className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{
            background: 'rgba(0,0,0,0.22)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-live="polite"
        >
          <span
            className="font-bold tabular-nums text-[13px] sm:text-[14px]"
            style={{ color: 'var(--color-yellow)', letterSpacing: '0.06em' }}
          >
            <CountUp value={globalTotal !== null ? globalTotal : FALLBACK_TOTAL} />
          </span>
          <span
            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: 'rgba(245,241,232,0.62)' }}
          >
            Alibis dispensed
          </span>
        </div>

        {/* Excuse panel */}
        <section
          id="excuse"
          aria-labelledby="excuse-h"
          className="excuse-panel relative w-full px-6 sm:px-10 py-7 sm:py-9 mt-5 sm:mt-6"
        >
          <h2 id="excuse-h" className="sr-only">Today's ruling</h2>
          <p
            key={genCount}
            className="fade-in text-center text-[1.35rem] sm:text-[1.7rem] lg:text-[1.9rem] leading-[1.22] font-semibold tracking-[-0.02em] text-balance max-w-xl mx-auto"
            style={{ color: 'var(--color-cream)' }}
          >
            <span style={{ color: 'rgba(245,241,232,0.32)' }} aria-hidden>&ldquo;</span>
            {cardText}
            <span style={{ color: 'rgba(245,241,232,0.32)' }} aria-hidden>&rdquo;</span>
          </p>

          <div
            className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 flex items-center gap-1.5"
            role="group"
            aria-label="Rate this ruling"
          >
            <ThumbButton direction="down" active={vote === 'down'} onClick={() => handleVote('down')} />
            <ThumbButton direction="up" active={vote === 'up'} onClick={() => handleVote('up')} />
          </div>
        </section>

        {/* Yellow CTA */}
        <button
          type="button"
          onClick={handleGenerate}
          className="btn-press cta-gold mt-5 sm:mt-6 w-full rounded-[14px] py-3.5 sm:py-4 text-[14px] sm:text-[16px] font-bold uppercase tracking-[0.13em] cursor-pointer"
        >
          {ctaLabel}
        </button>

        {/* Race share row — 3 colour pills, same shape, same shadow */}
        <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 sm:gap-2.5" aria-label="Share">
          <SharePill href={fbUrl} variant="blue" ariaLabel="Share on Facebook">
            <FbIcon /> <span>Facebook</span>
          </SharePill>
          <SharePill href={xUrl} variant="black" ariaLabel="Post on X">
            <XIcon /> <span>X</span>
          </SharePill>
          <SharePill onClick={handleCopy} variant="red" ariaLabel={copied ? 'Pocketed' : 'Pocket this excuse'}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span>{copied ? 'Pocketed' : 'Pocket it'}</span>
          </SharePill>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function ThumbButton({ direction, active, onClick }) {
  const isUp = direction === 'up';
  const bg = active
    ? isUp ? 'var(--color-yellow)' : 'var(--color-red)'
    : 'rgba(255,255,255,0.10)';
  const color = active
    ? isUp ? 'var(--color-fairway-deep)' : '#FFFFFF'
    : 'rgba(255,255,255,0.65)';
  const ring = active ? 'transparent' : 'rgba(255,255,255,0.15)';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isUp ? 'Pure' : 'Shanked'}
      title={isUp ? 'Pure' : 'Shanked'}
      aria-pressed={active}
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${active ? 'pop' : 'hover:bg-white/20'}`}
      style={{ background: bg, color, border: `1px solid ${ring}` }}
    >
      <ThumbIcon up={isUp} />
    </button>
  );
}

function ThumbIcon({ up }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="pointer-events-none"
      style={{ transform: up ? 'none' : 'rotate(180deg)' }}
    >
      <path d="M2 11v9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1zm20.5-1.5h-6.65l.6-3.16c.04-.21.06-.42.06-.64 0-.4-.16-.78-.44-1.06L15.17 4l-6.59 6.59c-.36.36-.58.86-.58 1.41v8c0 1.1.9 2 2 2h8.51c.71 0 1.37-.39 1.71-1.02l3.18-7.42c.07-.16.1-.34.1-.52v-1.96c0-.83-.67-1.5-1.5-1.5z" />
    </svg>
  );
}

function SharePill({ href, onClick, variant, ariaLabel, children }) {
  const Tag = href ? 'a' : 'button';
  const props = href
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { onClick, type: 'button' };

  const variantClass = variant === 'blue' ? 'btn-blue'
    : variant === 'black' ? 'btn-black'
    : variant === 'red' ? 'btn-red'
    : '';

  return (
    <Tag
      {...props}
      aria-label={ariaLabel}
      className={`btn-press ${variantClass} inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-[14px] text-[12px] sm:text-[13px] font-semibold cursor-pointer`}
    >
      {children}
    </Tag>
  );
}

function FbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
