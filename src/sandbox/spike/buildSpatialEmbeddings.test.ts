import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../api/parseFdjCsv.ts';
import { buildSpatialEmbeddings } from './buildSpatialEmbeddings.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');

describe('buildSpatialEmbeddings', () => {
  it('produces one finite 3D SpatialEmbedding per draw from the real dataset', () => {
    const csvText = readFileSync(REAL_CSV_PATH, 'utf8');
    const draws = parseFdjCsv(csvText);

    const embeddings = buildSpatialEmbeddings(draws);

    expect(embeddings).toHaveLength(draws.length);
    embeddings.forEach((embedding, index) => {
      expect(embedding.drawId).toBe(draws[index].id);
      expect(embedding.method).toBe('pca');
      expect(Number.isFinite(embedding.coordinates.x)).toBe(true);
      expect(Number.isFinite(embedding.coordinates.y)).toBe(true);
      expect(Number.isFinite(embedding.coordinates.z)).toBe(true);
    });
  });
});
