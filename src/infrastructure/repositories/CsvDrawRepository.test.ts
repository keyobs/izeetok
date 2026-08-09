import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCsvDrawRepository } from './CsvDrawRepository.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const csvText = readFileSync(REAL_CSV_PATH, 'utf8');

describe('createCsvDrawRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the CSV once and reuses it across calls', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response(csvText)));
    vi.stubGlobal('fetch', fetchSpy);
    const repository = createCsvDrawRepository('/results/test.csv');

    const all = await repository.getAll();
    const latest = await repository.getLatest(5);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(all.length).toBeGreaterThan(600);
    expect(latest).toHaveLength(5);
  });

  it('getLatest returns draws ordered from most to least recent', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(csvText)));
    const repository = createCsvDrawRepository('/results/test.csv');

    const latest = await repository.getLatest(10);

    const dates = latest.map((draw) => new Date(draw.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it('getByDate finds an existing draw and returns null for an unknown date', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(csvText)));
    const repository = createCsvDrawRepository('/results/test.csv');
    const [mostRecent] = await repository.getLatest(1);

    expect(await repository.getByDate(mostRecent.date)).toEqual(mostRecent);
    expect(await repository.getByDate('1900-01-01')).toBeNull();
  });
});
