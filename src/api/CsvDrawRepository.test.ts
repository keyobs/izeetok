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

  it('rejects with a clear error when the CSV request fails, instead of parsing the error body', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>not found</html>', { status: 404 })));
    const repository = createCsvDrawRepository('/results/test.csv');

    await expect(repository.getAll()).rejects.toThrow('HTTP 404');
  });

  it('retries the fetch on the next call after a failure, instead of caching the rejection', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response(csvText));
    vi.stubGlobal('fetch', fetchSpy);
    const repository = createCsvDrawRepository('/results/test.csv');

    await expect(repository.getAll()).rejects.toThrow('HTTP 500');
    const all = await repository.getAll();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(all.length).toBeGreaterThan(600);
  });
});
