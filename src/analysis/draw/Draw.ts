import type { Grid } from '../grid/Grid.ts';

export interface Draw {
  id: string;
  date: string;
  numbers: Grid['numbers'];
  stars: Grid['stars'];
  jackpot?: number;
  source: 'fdj-csv' | 'api' | 'manual';
}
