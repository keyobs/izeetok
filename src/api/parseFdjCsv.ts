import type { Draw } from '../analysis/draw/Draw.ts';
import { parseGrid } from '../analysis/grid/Grid.ts';

const DASH_NUMBER = /-(\d+)/g;

const parseDashList = (value: string): number[] =>
  [...value.matchAll(DASH_NUMBER)].map((match) => Number(match[1]));

const parseFdjDate = (value: string): string => {
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
};

const columnIndex = (columns: string[], name: string): number => {
  const index = columns.indexOf(name);
  if (index === -1) throw new Error(`Missing FDJ CSV column: ${name}`);
  return index;
};

export const parseFdjCsv = (csvText: string): Draw[] => {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const [headerLine, ...rows] = lines;
  const columns = headerLine.split(';');

  const idIndex = columnIndex(columns, 'annee_numero_de_tirage');
  const dateIndex = columnIndex(columns, 'date_de_tirage');
  const numbersIndex = columnIndex(columns, 'boules_gagnantes_en_ordre_croissant');
  const starsIndex = columnIndex(columns, 'etoiles_gagnantes_en_ordre_croissant');

  return rows.map((row) => {
    const cells = row.split(';');
    const grid = parseGrid({
      numbers: parseDashList(cells[numbersIndex]),
      stars: parseDashList(cells[starsIndex]),
    });

    return {
      id: cells[idIndex],
      date: parseFdjDate(cells[dateIndex]),
      numbers: grid.numbers,
      stars: grid.stars,
      source: 'fdj-csv',
    } satisfies Draw;
  });
};
