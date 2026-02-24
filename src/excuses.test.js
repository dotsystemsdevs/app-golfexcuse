const { EXCUSES } = require('./excuses');

describe('EXCUSES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(EXCUSES)).toBe(true);
    expect(EXCUSES.length).toBeGreaterThan(0);
  });

  it('has at least 140 items', () => {
    expect(EXCUSES.length).toBeGreaterThanOrEqual(140);
  });

  it('every item is a non-empty string', () => {
    EXCUSES.forEach((excuse, i) => {
      expect(typeof excuse).toBe('string');
      expect(excuse.trim().length).toBeGreaterThan(0);
    });
  });

  it('no duplicate excuses', () => {
    const set = new Set(EXCUSES);
    expect(set.size).toBe(EXCUSES.length);
  });

  it('no item is only whitespace', () => {
    EXCUSES.forEach((excuse) => {
      expect(excuse.trim()).toBe(excuse);
      expect(excuse).not.toBe('');
    });
  });
});
