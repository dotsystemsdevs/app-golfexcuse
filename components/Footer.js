'use client';

const GITHUB_URL = 'https://github.com/dotsystemsdevs/app-golfexcuse';
const BMC_URL = 'https://buymeacoffee.com/dotdevs';

export default function Footer() {
  return (
    <footer
      className="relative z-10 w-full flex-shrink-0 px-5 py-3 sm:py-3.5 flex items-center justify-center gap-4 sm:gap-5 text-[11px] sm:text-[12px] text-white/85 font-semibold"
      style={{ paddingBottom: 'max(0.85rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors"
      >
        GitHub
      </a>
      <span className="opacity-50" aria-hidden>·</span>
      <a
        href={BMC_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors"
      >
        ☕ Tip the caddie
      </a>
    </footer>
  );
}
