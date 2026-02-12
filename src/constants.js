/**
 * App configuration and design tokens.
 * Single source of truth: URLs, storage keys, timing, layout.
 * Do not duplicate these values in App.js or elsewhere.
 */

export const CONFIG = {
  REVIEW_PROMPT_AFTER_GENERATES: 3,       // Visa betygsprompt efter N genereringar
  STORAGE_KEY_ASKED_REVIEW: 'app_golfexcuse_asked_review',
  LEGAL_BASE_URL: 'https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse',
  GENERATE_DELAY_MS: 1100,                // Fördröjning innan ursäkt visas (ms)
  COPY_RESET_MS: 1800,                   // Hur länge "Copied!" visas (ms)
  SPLASH_MIN_MS: 1000,                   // Minsta tid inledande laddningsskärm (ms)
};

export const QUICK_OPTIONS = ['Windy', 'Rain', 'Cold', 'Hot'];

export const PLACEHOLDER = 'Tap the yellow button below to get your first excuse.';

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
export const FONT = { caption: 14, label: 15, body: 17, bodyLg: 19, subtitle: 17, title: 28, btn: 24 };
export const LAYOUT = {
  touchTarget: 48,
  btnMinHeight: 64,
  scrollMinHeight: 100,
  cardMinHeight: 152,
  cardTopWithCopy: 58,
  cardTextRight: 60,
};

export const PALETTE = {
  bg: '#4F755E',
  surface: '#2F5E3C',
  border: '#5F8E73',
  accent: '#E8B923',
  cta: '#E8B923',
  ctaBorder: '#F5C542',
  ctaText: '#111111',
  text: '#E6E6E6',
  textMuted: '#CFCFCF',
  shadow: '#111111',
};
