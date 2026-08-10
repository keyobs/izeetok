import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const REAL_CSV_TEXT = readFileSync(
  resolve(process.cwd(), 'public/results/euromillions_202002.csv'),
  'utf8',
);
