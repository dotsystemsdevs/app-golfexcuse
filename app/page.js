'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import TopBanner from '@/components/TopBanner';
import Footer from '@/components/Footer';
import CountUp from '@/components/CountUp';
import { EXCUSES, getDailyExcuse } from '@/lib/excuses';
import { getExcuseText, pickDifferentWeighted } from '@/lib/utils';
import { getExcuseId } from '@/lib/excuse-ids';
import { fetchGeneratedTotal, trackGenerated, voteForExcuse } from '@/lib/api';

const FALLBACK_TOTAL = 1247;

const BTN = [
  'Tee the next one',
  'Mulligan',
  'Foursome draw',
  'Punch out',
  'Shag again',
  'From the drop zone',
  'One more for the card',
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
  const counterReady = globalTotal !== null;

  useEffect(() => {
    setCurrentExcuseId(getExcuseId(dailyExcuse.text));
  }, [dailyExcuse]);

  useEffect(() => {
    fetchGeneratedTotal()
      .then((t) => setGlobalTotal(t || FALLBACK_TOTAL))
      .catch(() => setGlobalTotal(FALLBACK_TOTAL));
  }, []);

  const handleGenerate = useCallback(() => {
    const picked = pickDifferentWeighted(EXCUSES, cardText, seenExcuses.current);
    const txt = getExcuseText(picked);
    setExcuse(txt);
    setCurrentExcuseId(getExcuseId(txt));
    setVote(null);
    setHasGenerated(true);
    setGenCount((c) => c + 1);
    setGlobalTotal((cur) => (cur == null ? cur : cur + 1));
    trackGenerated().then((t) => {
      if (typeof t === 'number') setGlobalTotal(t);
    });
  }, [cardText]);

  const handleVote = useCallback(
    async (direction) => {
      setVote((prev) => (prev === direction ? null : direction));
      if (currentExcuseId) {
        try {
          const res = await voteForExcuse(currentExcuseId, direction);
          if (res && 'vote' in res) setVote(res.vote);
        } catch {
          // offline
        }
      }
    },
    [currentExcuseId]
  );

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${cardText}" — that was my reason for the round.`)}&url=${encodeURIComponent(baseUrl)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}&quote=${encodeURIComponent(`"${cardText}"`)}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`"${cardText}" — Bogey Blamer ${baseUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // denied
    }
  }, [cardText, baseUrl]);

  const label = !hasGenerated ? BTN[0] : BTN[Math.min(genCount, BTN.length - 1)];

  return (
    <main
      className="relative flex w-full max-w-[100vw] min-h-dvh flex-col overflow-x-hidden lg:h-dvh lg:max-h-dvh lg:min-h-0 lg:overflow-hidden"
      id="main"
    >
      <a href="#excuse" className="skip-link">
        Skip to excuse
      </a>
      <TopBanner />

      <div className="flex-1 flex min-h-0 flex-col items-stretch justify-center px-5 sm:px-8 py-6 sm:py-10 max-w-xl w-full mx-auto lg:max-w-2xl lg:px-8 lg:py-3 lg:overflow-hidden lg:max-h-full">
        <header
          className="flex w-full flex-col text-center mb-4 sm:mb-8 shrink-0 lg:mb-3"
          aria-labelledby="app-title"
        >
          <div className="mb-3 sm:mb-6 flex items-center justify-center gap-3 sm:gap-4 lg:mb-2">
            <Image
              src="/logo-dark.png"
              alt="Bogey Blamer"
              width={100}
              height={100}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain opacity-95"
              priority
            />
            <div className="text-left">
              <h1
                id="app-title"
                className="text-[1.5rem] sm:text-2xl font-semibold tracking-[-0.02em] text-white lg:text-[1.4rem]"
              >
                Bogey Blamer
              </h1>
              <p className="text-[0.7rem] sm:text-xs text-white/45 font-normal tracking-normal mt-0.5 lg:mt-0.5 not-italic">
                Golf alibis — printed on the spot
              </p>
            </div>
          </div>

          <div className="text-sm sm:text-base text-white/45 tabular-nums" aria-live="polite" aria-atomic>
            {counterReady ? (
              <p className="m-0">
                <span
                  className="font-semibold [font-feature-settings:'tnum']"
                  style={{ color: 'var(--color-tee-yellow-bright)' }}
                >
                  <CountUp value={globalTotal} />
                </span>
                <span className="text-white/50"> </span>
                <span className="text-white/35 text-[0.65rem] sm:text-xs font-medium uppercase tracking-[0.2em]">
                  excuses in play
                </span>
              </p>
            ) : (
              <p className="h-5 flex items-center justify-center m-0">
                <span className="count-skeleton w-16" aria-hidden />
                <span className="sr-only">Count loading</span>
              </p>
            )}
          </div>
        </header>

        <section id="excuse" aria-labelledby="excuse-h" className="min-h-0 shrink lg:flex-1 flex flex-col lg:min-h-0">
          <h2 id="excuse-h" className="sr-only">
            Alibi
          </h2>
          <div
            className="fade-in landing-card hand-card relative min-h-[10.5rem] sm:min-h-44 flex items-center justify-center px-5 py-6 pb-12 sm:px-8 sm:py-7 sm:pb-10 lg:min-h-0 lg:flex-1 lg:max-h-[min(32vh,13rem)] lg:py-4"
          >
            <p
              key={genCount}
              className="font-serif text-center text-base sm:text-lg leading-[1.5] sm:leading-[1.55] text-balance max-w-md mx-auto font-medium tracking-[-0.01em] text-[#1a1612] line-clamp-5 lg:line-clamp-4 lg:text-[1.05rem] lg:max-h-full lg:overflow-hidden"
            >
              <span className="text-[#2a1810]/30" aria-hidden>
                &ldquo;
              </span>
              {cardText}
              <span className="text-[#2a1810]/30" aria-hidden>
                &rdquo;
              </span>
            </p>

            <div
              className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 flex items-center gap-0.5 rounded-md bg-white/60 px-0.5 py-0.5 ring-1 ring-[#1a2e24]/8"
              role="group"
              aria-label="Vote on this alibi"
            >
              <ThumbButton direction="down" active={vote === 'down'} onClick={() => handleVote('down')} />
              <ThumbButton direction="up" active={vote === 'up'} onClick={() => handleVote('up')} />
            </div>
          </div>
        </section>

        <div className="mt-5 sm:mt-7 space-y-0 shrink-0 relative z-20 lg:mt-2">
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full cursor-pointer rounded-md border border-[#8a7220] py-3.5 sm:py-3.5 text-sm sm:text-base font-semibold text-[#0f0e0a] transition-colors duration-150 hover:brightness-105 active:translate-y-px"
            style={{ background: 'var(--color-tee-bright)' }}
          >
            {label}
          </button>
        </div>

        <div className="mt-6 sm:mt-8 shrink-0 lg:mt-2" aria-label="Share">
          <div className="muted-rule mb-3" aria-hidden />
          <p className="m-0 mb-2.5 text-center text-[0.65rem] text-white/30 font-medium tracking-wider">
            Send it
          </p>
          <div className="grid grid-cols-3 gap-2 w-full">
            <SharePill
              href={fbUrl}
              style={{ background: '#1e6eb8' }}
              ariaLabel="Share on Facebook"
            >
              <FbIcon />
              <span className="min-[400px]:hidden pl-0.5">FB</span>
              <span className="hidden min-[400px]:inline pl-0.5">Facebook</span>
            </SharePill>
            <SharePill
              href={xUrl}
              style={{ background: '#141a18' }}
              ariaLabel="Post on X"
            >
              <XIcon />
              <span className="pl-0.5">X</span>
            </SharePill>
            <SharePill
              onClick={handleCopy}
              style={{ background: 'rgba(0,0,0,0.2)' }}
              className="ring-1 ring-white/15"
              ariaLabel={copied ? 'Copied' : 'Copy to clipboard'}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>
                {copied ? 'Copied' : (
                  <>
                    <span className="min-[400px]:hidden">Copy</span>
                    <span className="hidden min-[400px]:inline">Copy text</span>
                  </>
                )}
              </span>
            </SharePill>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function ThumbButton({ direction, active, onClick }) {
  const isUp = direction === 'up';
  const activeColor = isUp ? 'var(--color-putting)' : 'var(--color-flag-bright)';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isUp ? 'Good alibi' : 'Weak alibi'}
      title={isUp ? 'Thumbs up' : 'Thumbs down'}
      aria-pressed={active}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded flex items-center justify-center transition-[background,box-shadow] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--color-tee-highlight)]"
      style={{
        background: active
          ? activeColor
          : 'rgba(255,255,255,0.85)',
        color: active ? '#fff' : 'rgba(37,33,28,0.55)',
        boxShadow: active
          ? '0 0 0 1px rgba(0,0,0,0.1) inset'
          : '0 0 0 1px rgba(26,46,38,0.12) inset',
      }}
    >
      <ThumbIcon up={isUp} />
    </button>
  );
}

function ThumbIcon({ up }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="pointer-events-none"
      style={{ transform: up ? 'none' : 'rotate(180deg)' }}
    >
      <path d="M2 11v9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1zm20.5-1.5h-6.65l.6-3.16c.04-.21.06-.42.06-.64 0-.4-.16-.78-.44-1.06L15.17 4l-6.59 6.59c-.36.36-.58.86-.58 1.41v8c0 1.1.9 2 2 2h8.51c.71 0 1.37-.39 1.71-1.02l3.18-7.42c.07-.16.1-.34.1-.52v-1.96c0-.83-.67-1.5-1.5-1.5z" />
    </svg>
  );
}

function SharePill({ href, onClick, style, ariaLabel, className = '', children }) {
  const Tag = href ? 'a' : 'button';
  const props = href
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { onClick, type: 'button' };

  return (
    <Tag
      {...props}
      aria-label={ariaLabel}
      className={[
        'inline-flex w-full min-w-0 min-h-10 max-w-full justify-center items-center gap-1.5',
        'px-2 sm:px-2.5 py-2.5',
        'rounded-md text-[0.68rem] min-[400px]:text-sm font-semibold text-white text-center',
        'transition [transition-property:filter,box-shadow,background] duration-150',
        'hover:brightness-110',
        'active:brightness-90',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--color-tee-highlight)] focus-visible:z-10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {children}
    </Tag>
  );
}

function FbIcon() {
  return (
    <svg className="flex-shrink-0 opacity-95" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      className="flex-shrink-0"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="flex-shrink-0"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
