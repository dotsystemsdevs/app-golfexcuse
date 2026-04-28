'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TopBanner from '@/components/TopBanner';
import Footer from '@/components/Footer';
import CountUp from '@/components/CountUp';
import { track } from '@vercel/analytics';
import { EXCUSES, EXCUSE_COUNT, getDailyExcuse, getExcuseNumber } from '@/lib/excuses';
import { getExcuseText, pickDifferentWeighted } from '@/lib/utils';
import { getExcuseId } from '@/lib/excuse-ids';
import { fetchGeneratedTotal, trackGenerated, voteForExcuse } from '@/lib/api';
import { playSplash } from '@/lib/sounds';

const FALLBACK_TOTAL = 0;

const CTA_FIRST = 'Take the Mulligan';
const CTA_LABELS = [
  'Another Mulligan',
  'Roll a new one',
  'Lie a little better',
  'Convince me',
  'Spin it again',
  'Lawyer up',
  'Plead the fifth',
  'Drop a new ball',
  'Foot wedge it',
  'Try the back nine',
  'Cope harder',
  'Punch out',
  'Last one, I swear',
  'One more, on me',
  'Tell the truth, kidding',
  'Sandbag it',
  'From the drop zone',
  'Take a free drop',
  'Replay that shot',
  'Find a softer truth',
];

function pickRandomLabel(prev) {
  if (CTA_LABELS.length <= 1) return CTA_LABELS[0];
  let next;
  do { next = CTA_LABELS[Math.floor(Math.random() * CTA_LABELS.length)]; } while (next === prev);
  return next;
}

export default function HomePage({ initialPickNumber = null } = {}) {
  const [excuse, setExcuse] = useState(null);
  const [currentExcuseId, setCurrentExcuseId] = useState(null);
  const [vote, setVote] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [genCount, setGenCount] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');

  const [ctaLabel, setCtaLabel] = useState(CTA_FIRST);

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

  useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
  }, []);

  const handleGenerate = useCallback(() => {
    playSplash();
    const picked = pickDifferentWeighted(EXCUSES, cardText, seenExcuses.current);
    const txt = getExcuseText(picked);
    const nextId = getExcuseId(txt);
    setExcuse(txt);
    setCurrentExcuseId(nextId);
    setVote(null);
    setHasGenerated(true);
    setGenCount((c) => c + 1);
    setCtaLabel((prev) => pickRandomLabel(prev));
    setGlobalTotal((cur) => (cur == null ? cur : cur + 1));
    track('generate_excuse', { excuseId: nextId, source: 'cta' });
    trackGenerated().then((t) => {
      if (typeof t === 'number' && t > 0) setGlobalTotal(t);
    });
  }, [cardText]);

  const handlePickByNumber = useCallback((raw) => {
    const n = Number.parseInt(String(raw || '').trim(), 10);
    if (!Number.isFinite(n) || n < 1 || n > EXCUSE_COUNT) return;
    const txt = EXCUSES[n - 1]?.text;
    const nextId = getExcuseId(txt);
    setExcuse(txt);
    setCurrentExcuseId(nextId);
    setVote(null);
    setHasGenerated(true);
    setGenCount((c) => c + 1);
    track('pick_excuse_by_number', { excuseId: nextId || 'unknown', number: n, source: 'picker' });
  }, []);

  useEffect(() => {
    if (initialPickNumber == null) return;
    handlePickByNumber(initialPickNumber);
  }, [initialPickNumber, handlePickByNumber]);

  const handleVote = useCallback(async (direction) => {
    setVote((prev) => {
      const next = prev === direction ? null : direction;
      track('vote_excuse', {
        excuseId: currentExcuseId || 'unknown',
        direction,
        action: next ? 'vote' : 'unvote',
        surface: 'thumb_buttons',
      });
      return next;
    });
    if (currentExcuseId) {
      try {
        const res = await voteForExcuse(currentExcuseId, direction);
        if (res && 'vote' in res) setVote(res.vote);
      } catch {}
    }
  }, [currentExcuseId]);

  const excuseNumber = getExcuseNumber(cardText);
  const shareUrl = baseUrl && excuseNumber ? `${baseUrl}/${excuseNumber}` : baseUrl;
  const shareTitle = `"${cardText}" — Excuse Caddie`;
  const shareTextX = `"${cardText}" — my official ruling on that round.`;
  const redditTitle = `"${cardText}" — Excuse Caddie ruling #${excuseNumber || ''}`.trim();

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTextX)}&url=${encodeURIComponent(shareUrl)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`"${cardText}"`)}`;
  const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(redditTitle)}`;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = useCallback(async () => {
    const payload = `"${cardText}" — Excuse Caddie ${shareUrl}`;
    if (canNativeShare) {
      try {
        await navigator.share({ title: shareTitle, text: `"${cardText}"`, url: shareUrl });
        track('share_copy', { excuseId: currentExcuseId || 'unknown', success: true, surface: 'native_share' });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') {
          track('share_copy', { excuseId: currentExcuseId || 'unknown', success: false, surface: 'native_share', reason: 'cancelled' });
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      track('share_copy', { excuseId: currentExcuseId || 'unknown', success: true, surface: 'clipboard' });
    } catch {}
  }, [cardText, shareUrl, shareTitle, currentExcuseId, canNativeShare]);

  return (
    <main className="relative flex h-dvh max-h-dvh overflow-hidden flex-col" id="main">
      <a href="#excuse" className="skip-link">Skip to excuse</a>
      <TopBanner />

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-5 py-4 sm:py-6 max-w-2xl mx-auto w-full">
        {/* Wordmark */}
        <h1
          className="text-[2rem] sm:text-[2.6rem] lg:text-[3rem] leading-[0.95] tracking-[-0.035em] text-center font-extrabold"
          style={{ color: 'var(--color-cream)' }}
        >
          Excuse Caddie
        </h1>

        {/* Counter — simple line (no pill) */}
        <p
          className="mt-3 sm:mt-3.5 text-center tabular-nums"
          style={{ color: 'rgba(245,241,232,0.55)' }}
          aria-live="polite"
        >
          <span className="inline-flex items-baseline gap-2">
            <span className="font-semibold" style={{ color: 'var(--color-yellow)', letterSpacing: '0.01em' }}>
              <CountUp value={globalTotal !== null ? globalTotal : FALLBACK_TOTAL} />
            </span>
            <span className="text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.18em]">
              alibis on the card
            </span>
          </span>
        </p>

        {/* Excuse panel — clean cream card */}
        <div className="relative w-full mt-5 sm:mt-6">
          <section
            id="excuse"
            aria-labelledby="excuse-h"
            className="excuse-panel w-full px-6 sm:px-10 py-7 sm:py-9 min-h-[9.5rem] sm:min-h-[10.5rem] flex items-center justify-center"
          >
            <h2 id="excuse-h" className="sr-only">Today's ruling</h2>
            <p
              key={genCount}
              className="fade-in text-center text-[1.15rem] sm:text-[1.45rem] lg:text-[1.55rem] leading-[1.32] font-semibold tracking-[-0.01em] text-balance max-w-xl mx-auto"
              style={{ color: '#1A1916' }}
            >
              {cardText}
            </p>
          </section>

          {/* Vote buttons — top-right, slightly above the card */}
          <div
            className="absolute -top-4 right-3 sm:right-4 flex items-center gap-2"
            role="group"
            aria-label="Rate this ruling"
          >
            <ThumbButton direction="down" active={vote === 'down'} onClick={() => handleVote('down')} />
            <ThumbButton direction="up" active={vote === 'up'} onClick={() => handleVote('up')} />
          </div>
        </div>

        {/* Yellow CTA */}
        <button
          type="button"
          onClick={handleGenerate}
          className="btn-press cta-gold mt-5 sm:mt-6 w-full rounded-[14px] py-3.5 sm:py-4 text-[14px] sm:text-[16px] font-bold uppercase tracking-[0.13em] cursor-pointer"
        >
          {ctaLabel}
        </button>

        {/* Race share row */}
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5" aria-label="Share">
          <SharePill
            href={redditUrl}
            variant="orange"
            ariaLabel="Share on Reddit"
            onClick={() => track('share_open', { network: 'reddit', excuseId: currentExcuseId || 'unknown' })}
          >
            <RedditIcon /> <span>Reddit</span>
          </SharePill>
          <SharePill
            href={xUrl}
            variant="black"
            ariaLabel="Post on X"
            onClick={() => track('share_open', { network: 'x', excuseId: currentExcuseId || 'unknown' })}
          >
            <XIcon /> <span>X</span>
          </SharePill>
          <SharePill
            href={fbUrl}
            variant="blue"
            ariaLabel="Share on Facebook"
            onClick={() => track('share_open', { network: 'facebook', excuseId: currentExcuseId || 'unknown' })}
          >
            <FbIcon /> <span>Facebook</span>
          </SharePill>
          <SharePill
            onClick={handleCopy}
            variant="red"
            ariaLabel={copied ? 'Pocketed' : (canNativeShare ? 'Share this excuse' : 'Pocket this excuse')}
          >
            {copied ? <CheckIcon /> : (canNativeShare ? <ShareIcon /> : <CopyIcon />)}
            <span>{copied ? 'Pocketed' : (canNativeShare ? 'Share' : 'Pocket it')}</span>
          </SharePill>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function ThumbButton({ direction, active, onClick }) {
  const isUp = direction === 'up';
  const bg = isUp ? 'var(--color-green)' : 'var(--color-red)';
  const background = active ? bg : `color-mix(in srgb, ${bg} 62%, white 38%)`;
  const color = active ? '#fff' : `color-mix(in srgb, ${bg} 15%, #1A1916 85%)`;
  const ring = active ? 'transparent' : 'rgba(26,25,22,0.16)';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isUp ? 'Pure' : 'Shanked'}
      title={isUp ? 'Pure' : 'Shanked'}
      aria-pressed={active}
      className={`thumb-btn-light w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer ${active ? 'pop' : ''}`}
      style={{ background: background, color, border: `1px solid ${ring}` }}
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
    ? { href, target: '_blank', rel: 'noopener noreferrer', onClick }
    : { onClick, type: 'button' };

  const variantClass = variant === 'blue' ? 'btn-blue'
    : variant === 'black' ? 'btn-black'
    : variant === 'red' ? 'btn-red'
    : variant === 'orange' ? 'btn-orange'
    : '';

  return (
    <Tag
      {...props}
      aria-label={ariaLabel}
      className={`share-pill ${variantClass} inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-[14px] text-[12px] sm:text-[13px] font-semibold cursor-pointer`}
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

function RedditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
