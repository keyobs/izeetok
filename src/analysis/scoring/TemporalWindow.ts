import type { Draw } from '../draw/Draw.ts';

export type TemporalWindow = 1 | 3 | 6 | 12 | 25 | 50 | 'all';

export const TEMPORAL_WINDOWS: TemporalWindow[] = [1, 3, 6, 12, 25, 50, 'all'];

export const filterByWindow = (
  draws: Draw[],
  window: TemporalWindow,
  referenceDate: Date,
): Draw[] => {
  if (window === 'all') return draws;

  const cutoff = new Date(referenceDate);
  cutoff.setFullYear(cutoff.getFullYear() - window);

  return draws.filter((draw) => new Date(draw.date) >= cutoff);
};

export const latestDrawDate = (draws: Draw[]): Date =>
  draws.reduce((latest, draw) => {
    const drawDate = new Date(draw.date);
    return drawDate > latest ? drawDate : latest;
  }, new Date(0));
