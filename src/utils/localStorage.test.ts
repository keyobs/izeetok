import { afterEach, describe, expect, it } from 'vitest';
import { readJSON, removeItem, writeJSON } from './localStorage.ts';

describe('localStorage helpers', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns null when the key is absent', () => {
    expect(readJSON('missing-key')).toBeNull();
  });

  it('round-trips a JSON-serializable value', () => {
    writeJSON('numbers', { numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    expect(readJSON('numbers')).toEqual({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
  });

  it('returns null instead of throwing on corrupted content', () => {
    localStorage.setItem('corrupted', 'not json{');

    expect(readJSON('corrupted')).toBeNull();
  });

  it('removes a stored value', () => {
    writeJSON('to-remove', 42);
    removeItem('to-remove');

    expect(readJSON('to-remove')).toBeNull();
  });
});
