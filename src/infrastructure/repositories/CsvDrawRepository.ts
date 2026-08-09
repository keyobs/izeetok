import type { Draw } from '../../domain/draw/Draw.ts';
import { parseFdjCsv } from '../csv/parseFdjCsv.ts';
import type { DrawRepository } from './DrawRepository.ts';

export const DEFAULT_CSV_URL = '/results/euromillions_202002.csv';

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
