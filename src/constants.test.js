const {
  CONFIG,
  PLACEHOLDER,
  LOADING_MESSAGES,
  SPACING,
  RADIUS,
  FONT,
  PALETTE,
  LAYOUT,
} = require('./constants');

describe('CONFIG', () => {
  it('has required keys', () => {
    expect(CONFIG).toHaveProperty('REVIEW_PROMPT_AFTER_GENERATES');
    expect(CONFIG).toHaveProperty('STORAGE_KEY_ASKED_REVIEW');
    expect(CONFIG).toHaveProperty('LEGAL_BASE_URL');
    expect(CONFIG).toHaveProperty('GENERATE_DELAY_MS');
    expect(CONFIG).toHaveProperty('COPY_RESET_MS');
    expect(CONFIG).toHaveProperty('SPLASH_MIN_MS');
  });

  it('REVIEW_PROMPT_AFTER_GENERATES is a positive number', () => {
    expect(typeof CONFIG.REVIEW_PROMPT_AFTER_GENERATES).toBe('number');
    expect(CONFIG.REVIEW_PROMPT_AFTER_GENERATES).toBeGreaterThan(0);
  });

  it('STORAGE_KEY_ASKED_REVIEW is non-empty string', () => {
    expect(typeof CONFIG.STORAGE_KEY_ASKED_REVIEW).toBe('string');
    expect(CONFIG.STORAGE_KEY_ASKED_REVIEW.length).toBeGreaterThan(0);
  });

  it('LEGAL_BASE_URL is https URL', () => {
    expect(CONFIG.LEGAL_BASE_URL).toMatch(/^https:\/\//);
  });

  it('GENERATE_DELAY_MS and COPY_RESET_MS and SPLASH_MIN_MS are positive numbers', () => {
    expect(CONFIG.GENERATE_DELAY_MS).toBeGreaterThan(0);
    expect(CONFIG.COPY_RESET_MS).toBeGreaterThan(0);
    expect(CONFIG.SPLASH_MIN_MS).toBeGreaterThan(0);
  });
});

describe('PLACEHOLDER', () => {
  it('is non-empty string', () => {
    expect(typeof PLACEHOLDER).toBe('string');
    expect(PLACEHOLDER.length).toBeGreaterThan(0);
  });
});

describe('LOADING_MESSAGES', () => {
  it('is non-empty array of strings', () => {
    expect(Array.isArray(LOADING_MESSAGES)).toBe(true);
    expect(LOADING_MESSAGES.length).toBeGreaterThan(0);
    LOADING_MESSAGES.forEach((msg) => {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });
});

describe('SPACING', () => {
  it('has expected keys and positive number values', () => {
    const keys = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'];
    keys.forEach((k) => {
      expect(SPACING).toHaveProperty(k);
      expect(SPACING[k]).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('RADIUS', () => {
  it('has expected keys and non-negative values', () => {
    const keys = ['sm', 'md', 'lg', 'xl', 'xxl', 'full'];
    keys.forEach((k) => {
      expect(RADIUS).toHaveProperty(k);
      expect(RADIUS[k]).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('FONT', () => {
  it('has expected keys and positive number values', () => {
    const keys = ['caption', 'label', 'body', 'bodyLg', 'subtitle', 'title', 'btn'];
    keys.forEach((k) => {
      expect(FONT).toHaveProperty(k);
      expect(FONT[k]).toBeGreaterThan(0);
    });
  });
});

describe('LAYOUT', () => {
  it('has expected keys and positive number values', () => {
    expect(LAYOUT.touchTarget).toBeGreaterThan(0);
    expect(LAYOUT.btnMinHeight).toBeGreaterThan(0);
    expect(LAYOUT.scrollMinHeight).toBeGreaterThan(0);
    expect(LAYOUT.cardMinHeight).toBeGreaterThan(0);
    expect(LAYOUT.cardTopWithCopy).toBeGreaterThan(0);
    expect(LAYOUT.cardTextRight).toBeGreaterThan(0);
  });
});

describe('PALETTE', () => {
  it('has expected keys and hex color strings', () => {
    const keys = ['bg', 'surface', 'border', 'accent', 'cta', 'ctaBorder', 'ctaText', 'text', 'textMuted', 'shadow'];
    keys.forEach((k) => {
      expect(PALETTE).toHaveProperty(k);
      expect(PALETTE[k]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
