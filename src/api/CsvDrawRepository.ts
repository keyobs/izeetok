import type { Draw } from '../analysis/draw/Draw.ts';
import { parseFdjCsv } from './parseFdjCsv.ts';
import type { DrawRepository } from './DrawRepository.ts';

export const DEFAULT_CSV_URL = `${import.meta.env.BASE_URL}results/euromillions_202002.csv`;

export const createCsvDrawRepository = (csvUrl: string = DEFAULT_CSV_URL): DrawRepository => {
  let cachedDraws: Promise<Draw[]> | null = null;

  const loadDraws = (): Promise<Draw[]> => {
    cachedDraws ??= fetch(csvUrl)
      .then((response) => response.text())
      .then((csvText) => parseFdjCsv(csvText));
    return cachedDraws;
  };

  return {
    async getAll() {
      return loadDraws();
    },
    async getLatest(limit) {
      const draws = await loadDraws();
      return [...draws]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    },
    async getByDate(date) {
      const draws = await loadDraws();
      return draws.find((draw) => draw.date === date) ?? null;
    },
  };
};
