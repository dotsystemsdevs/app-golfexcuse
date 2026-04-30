/**
 * App configuration and design tokens.
 * Palette mirrors the Excuse Caddie website (webb/app/globals.css).
 */

export const CONFIG = {
  STORAGE_KEY_ASKED_REVIEW: 'excuse_caddie_asked_review',
  REVIEW_PROMPT_EVERY_N: 8,
  LEGAL_BASE_URL: 'https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.dotsystems.appgolfexcuse',
  APP_STORE_URL: 'https://apps.apple.com/us/app/bogey-blamer-golf-excuses/id6759191239',
  GITHUB_URL: 'https://github.com/dotsystemsdevs/excuse-caddie',
  BMC_URL: 'https://buymeacoffee.com/dotdevs',
  WEB_URL: 'https://excusecaddie.xyz',
  COPY_RESET_MS: 1800,
  SPLASH_MIN_MS: 800,
  SHAKE_THRESHOLD: 2.5,
  SHAKE_COOLDOWN_MS: 1500,
  SHAKE_INTERVAL_MS: 150,
};

export const FONT = { xs: 11, sm: 12, caption: 13, label: 14, body: 16, bodyLg: 18, title: 22, hero: 28 };

// Mirrors webb/app/globals.css @theme colors
export const PALETTE = {
  fairway: '#508560',
  fairwaySoft: '#649873',
  fairwayDeep: '#1F3528',
  yellow: '#E8C547',
  yellowDark: '#B8961E',
  blue: '#2E5AA8',
  black: '#14171A',
  green: '#2D8A57',
  red: '#C8362A',
  redDark: '#9E2820',
  cream: '#F5F1E8',
  panelCream: '#F2EBDB',
  ink: '#1A1916',
  orange: '#FF4500',
};

export const CTA_FIRST = 'Take the Mulligan';
export const CTA_LABELS = [
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
