import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { drawRepository } from '../../application/drawRepository.ts';
import type { Draw } from '../../domain/draw/Draw.ts';
import { extractFeatures } from '../../domain/features/FeatureExtractor.ts';
import { buildGeometryDescriptor } from '../../domain/geometry/GeometryDescriptor.ts';
import { findNearestNeighbors } from '../../domain/geometry/nearestNeighbors.ts';
import styles from './GeometryPage.module.scss';

const DECADE_LABELS = ['1-10', '11-20', '21-30', '31-40', '41-50'];
const NEIGHBOR_COUNT = 10;
const EMPTY_DRAWS: Draw[] = [];

const buildGapChain = (numbers: readonly number[]): string =>
  numbers
    .map((n, index) => (index === 0 ? String(n) : `—${n - numbers[index - 1]}→ ${n}`))
    .join(' ');

const GeometryPage = () => {
  const drawsQuery = useQuery({
    queryKey: ['draws', 'all'],
    queryFn: () => drawRepository.getAll(),
  });
  const draws = drawsQuery.data ?? EMPTY_DRAWS;

  const entries = useMemo(
    () =>
      [...draws]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((draw) => ({
          draw,
          descriptor: buildGeometryDescriptor({ numbers: draw.numbers, stars: draw.stars }),
          stdDev: extractFeatures({ numbers: draw.numbers, stars: draw.stars }).values.stdDev,
        })),
    [draws],
  );

  const sumAmplitudeData = entries.map((entry) => ({ sum: entry.descriptor.sum, range: entry.descriptor.range }));
  const sumStdDevData = entries.map((entry) => ({ sum: entry.descriptor.sum, stdDev: entry.stdDev }));

  const decadeHistogram = DECADE_LABELS.map((label, index) => ({
    decade: label,
    count: entries.reduce((acc, entry) => acc + entry.descriptor.decadeBuckets[index], 0),
  }));

  const referenceEntry = entries[0];
  const neighbors = referenceEntry
    ? findNearestNeighbors(
        referenceEntry.descriptor,
        entries.slice(1).map((entry) => ({ item: entry.draw, descriptor: entry.descriptor })),
        NEIGHBOR_COUNT,
      )
    : [];

  return (
    <div className={styles.page}>
      <h1>Géométrie</h1>

      {drawsQuery.isLoading && <p>Chargement...</p>}

      {entries.length > 0 && (
        <>
          <section data-testid="scatter-sum-amplitude">
            <h2>Somme × Amplitude</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="sum" name="Somme" type="number" />
                <YAxis dataKey="range" name="Amplitude" type="number" />
                <Tooltip />
                <Scatter data={sumAmplitudeData} fill="#7c6fd1" />
              </ScatterChart>
            </ResponsiveContainer>
          </section>

          <section data-testid="scatter-sum-stddev">
            <h2>Somme × Écart-type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="sum" name="Somme" type="number" />
                <YAxis dataKey="stdDev" name="Écart-type" type="number" />
                <Tooltip />
                <Scatter data={sumStdDevData} fill="#4f9d8f" />
              </ScatterChart>
            </ResponsiveContainer>
          </section>

          <section data-testid="decade-histogram">
            <h2>Histogramme des signatures de dizaines</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={decadeHistogram}>
                <CartesianGrid />
                <XAxis dataKey="decade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#c17b4f" />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {referenceEntry && (
            <>
              <section data-testid="gap-map">
                <h2>Carte des écarts</h2>
                <p>Tirage de référence : {referenceEntry.draw.date}</p>
                <p className={styles.gapChain}>{buildGapChain(referenceEntry.draw.numbers)}</p>
              </section>

              <section data-testid="nearest-neighbors">
                <h2>Voisins historiques (proximité géométrique)</h2>
                <p>
                  Les {NEIGHBOR_COUNT} tirages les plus proches du tirage de référence, par distance
                  géométrique - pas un graphe de proximité complet, mais la même donnée sous-jacente.
                </p>
                <ul>
                  {neighbors.map((neighbor) => (
                    <li key={neighbor.item.id} data-testid="neighbor-row">
                      {neighbor.item.date} — {neighbor.item.numbers.join(' · ')} (distance{' '}
                      {neighbor.distance.toFixed(3)})
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default GeometryPage;
