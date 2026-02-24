const { pickRandom } = require('./utils');

describe('pickRandom', () => {
  it('returns empty string for empty array', () => {
    expect(pickRandom([])).toBe('');
  });

  it('returns empty string for non-array (null)', () => {
    expect(pickRandom(null)).toBe('');
  });

  it('returns empty string for non-array (undefined)', () => {
    expect(pickRandom(undefined)).toBe('');
  });

  it('returns empty string for non-array (object)', () => {
    expect(pickRandom({ length: 1 })).toBe('');
  });

  it('returns the only item for single-element array', () => {
    expect(pickRandom(['only'])).toBe('only');
  });

  it('returns a string that is in the array', () => {
    const list = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      const result = pickRandom(list);
      expect(list).toContain(result);
    }
  });

  it('returns string type', () => {
    const list = ['x', 'y'];
    expect(typeof pickRandom(list)).toBe('string');
  });

  it('can return any element from list (statistical sanity)', () => {
    const list = ['first', 'second', 'third'];
    const seen = new Set();
    for (let i = 0; i < 100; i++) {
      seen.add(pickRandom(list));
    }
    expect(seen.size).toBe(list.length);
  });
});
