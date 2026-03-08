/**
 * App configuration and design tokens.
 * Single source of truth for URLs, storage keys, timing, layout.
 */

export const CONFIG = {
  REVIEW_PROMPT_AFTER_GENERATES: 10,
  STORAGE_KEY_ASKED_REVIEW: 'app_golfexcuse_asked_review',
  LEGAL_BASE_URL: 'https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.dotsystems.appgolfexcuse',
  APP_STORE_URL: 'https://apps.apple.com/us/app/bogey-blamer-golf-excuses/id6759191239',
  GENERATE_DELAY_MS: 1100,
  COPY_RESET_MS: 1800,
  SPLASH_MIN_MS: 1000,
  SHAKE_THRESHOLD: 2.5,
  SHAKE_COOLDOWN_MS: 1500,
  SHAKE_INTERVAL_MS: 150,
};

export const PLACEHOLDER = 'Shake or tap to get your first excuse.';

export const LOADING_MESSAGES = [
  'Generating…',
  'Loading…',
  'One moment…',
  'Preparing your excuse…',
  'Please wait…',
  'Almost there…',
];

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const RADIUS = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, full: 9999 };
export const FONT = { caption: 14, label: 15, body: 17, bodyLg: 19, subtitle: 17, title: 28 };
export const LAYOUT = {
  btnMinHeight: 64,
  scrollMinHeight: 100,
  cardMinHeight: 152,
};

export const PALETTE = {
  bg: '#4F755E',
  surface: '#2F5E3C',
  border: '#5F8E73',
  accent: '#E8B923',
  cta: '#E8B923',
  ctaText: '#111111',
  text: '#E6E6E6',
  textMuted: '#D9D9D9',
  cardEmptyBg: 'rgba(47,94,60,0.88)',
  error: '#E87C7C',
  shadow: '#111111',
};
