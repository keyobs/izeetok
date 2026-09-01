import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from './parseFdjCsv.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');

describe('parseFdjCsv', () => {
  it('parses a minimal FDJ-shaped CSV into Draws', () => {
    const csv = [
      'annee_numero_de_tirage;date_de_tirage;boules_gagnantes_en_ordre_croissant;etoiles_gagnantes_en_ordre_croissant',
      '26063;07/08/2026;-26-29-35-38-47-;-1-2-',
      '26062;04/08/2026;-25-30-34-46-50-;-1-12-',
    ].join('\n');

    const draws = parseFdjCsv(csv);

    expect(draws).toEqual([
      { id: '26063', date: '2026-08-07', numbers: [26, 29, 35, 38, 47], stars: [1, 2], source: 'fdj-csv' },
      { id: '26062', date: '2026-08-04', numbers: [25, 30, 34, 46, 50], stars: [1, 12], source: 'fdj-csv' },
    ]);
  });

  it('throws on a malformed row (invalid grid)', () => {
    const csv = [
      'annee_numero_de_tirage;date_de_tirage;boules_gagnantes_en_ordre_croissant;etoiles_gagnantes_en_ordre_croissant',
      '1;01/01/2024;-1-1-3-4-5-;-1-2-',
    ].join('\n');

    expect(() => parseFdjCsv(csv)).toThrow();
  });

  it('parses the full real FDJ export without throwing', () => {
    const csvText = readFileSync(REAL_CSV_PATH, 'utf8');

    const draws = parseFdjCsv(csvText);

    expect(draws.length).toBeGreaterThan(600);
    for (const draw of draws) {
      expect(draw.numbers).toHaveLength(5);
      expect(draw.stars).toHaveLength(2);
      expect(draw.source).toBe('fdj-csv');
      expect(draw.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
