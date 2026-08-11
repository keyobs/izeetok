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
import Bubble from '../../components/bubble/Bubble.tsx';
import NumberChain from '../../components/bubble/NumberChain.tsx';
import { drawRepository } from '../../application/drawRepository.ts';
import { generateVariations } from '../../application/generateVariations.ts';
import { VARIATION_LABELS } from '../../application/variationLabels.ts';
import type { Draw } from '../../domain/draw/Draw.ts';
import { extractFeatures } from '../../domain/features/FeatureExtractor.ts';
import { buildGeometryDescriptor } from '../../domain/geometry/GeometryDescriptor.ts';
import { findNearestNeighbors } from '../../domain/geometry/nearestNeighbors.ts';
import styles from './GeometryPage.module.scss';

const DECADE_LABELS = ['1-10', '11-20', '21-30', '31-40', '41-50'];
const NEIGHBOR_COUNT = 10;
const EMPTY_DRAWS: Draw[] = [];

interface HighlightDotProps {
  cx?: number;
  cy?: number;
}

const HighlightDot = ({ cx, cy }: HighlightDotProps) => (
  <circle cx={cx} cy={cy} r={7} fill="var(--accent-temporal)" stroke="var(--bg)" strokeWidth={2} />
);

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

  const referenceSumAmplitude = referenceEntry
    ? [{ sum: referenceEntry.descriptor.sum, range: referenceEntry.descriptor.range }]
    : [];
  const referenceSumStdDev = referenceEntry ? [{ sum: referenceEntry.descriptor.sum, stdDev: referenceEntry.stdDev }] : [];

  const neighbors = referenceEntry
    ? findNearestNeighbors(
        referenceEntry.descriptor,
        entries.slice(1).map((entry) => ({ item: entry.draw, descriptor: entry.descriptor })),
        NEIGHBOR_COUNT,
      )
    : [];

  const referenceVariation = useMemo(() => {
    if (!referenceEntry || draws.length === 0) return null;
    const [variation] = generateVariations(
      { numbers: referenceEntry.draw.numbers, stars: referenceEntry.draw.stars },
      draws,
    );
    return variation ?? null;
  }, [referenceEntry, draws]);

  return (
    <div className={styles.page}>
      <h1>Géométrie</h1>

      {drawsQuery.isLoading && <p>Chargement...</p>}

      {referenceEntry && (
        <div className={styles.referenceBanner} data-testid="reference-grid-banner">
          <div className={styles.referenceMeta}>
            <span className={styles.referenceLabel}>Grille de référence</span>
            <span>{referenceEntry.draw.date}</span>
          </div>
          <div className={styles.referenceBubbles}>
            {referenceEntry.draw.numbers.map((n) => (
              <Bubble key={n} value={n} variant="number" />
            ))}
            {referenceEntry.draw.stars.map((s) => (
              <Bubble key={s} value={s} variant="star" />
            ))}
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <>
          <section className={styles.section} data-testid="scatter-sum-amplitude">
            <h2>Somme × Amplitude</h2>
            <p className={styles.description}>
              Chaque point est un tirage historique : la somme des 5 numéros (axe horizontal) et l'amplitude, l'écart
              entre le plus petit et le plus grand numéro (axe vertical). Le point mis en évidence est la grille de
              référence ci-dessus.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="sum" name="Somme" type="number" />
                <YAxis dataKey="range" name="Amplitude" type="number" />
                <Tooltip />
                <Scatter data={sumAmplitudeData} fill="#7c6fd1" />
                <Scatter data={referenceSumAmplitude} shape={HighlightDot} />
              </ScatterChart>
            </ResponsiveContainer>
          </section>

          <section className={styles.section} data-testid="scatter-sum-stddev">
            <h2>Somme × Écart-type</h2>
            <p className={styles.description}>
              Même principe, avec l'écart-type (axe vertical) : il mesure si les 5 numéros sont plutôt regroupés ou
              dispersés autour de leur moyenne.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="sum" name="Somme" type="number" />
                <YAxis dataKey="stdDev" name="Écart-type" type="number" />
                <Tooltip />
                <Scatter data={sumStdDevData} fill="#4f9d8f" />
                <Scatter data={referenceSumStdDev} shape={HighlightDot} />
              </ScatterChart>
            </ResponsiveContainer>
          </section>

          <section className={styles.section} data-testid="decade-histogram">
            <h2>Histogramme des signatures de dizaines</h2>
            <p className={styles.description}>
              Sur tout l'historique, combien de numéros sont tombés dans chacune des cinq tranches de dizaines
              (1-10, 11-20, 21-30, 31-40, 41-50).
            </p>
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
              <section className={styles.section} data-testid="gap-map">
                <h2>Carte des écarts</h2>
                <p className={styles.description}>
                  Les 5 numéros d'une grille, dans l'ordre croissant, reliés par l'écart (la distance) qui les
                  sépare - une façon de visualiser sa "forme" plutôt que sa seule liste de numéros.
                </p>

                <div className={styles.chainGroup}>
                  <span className={styles.chainLabel}>Grille de référence ({referenceEntry.draw.date})</span>
                  <NumberChain numbers={referenceEntry.draw.numbers} variant="highlight" />
                </div>

                {referenceVariation && (
                  <div className={styles.chainGroup}>
                    <span className={styles.chainLabel}>
                      Variation proposée : {VARIATION_LABELS[referenceVariation.kind]}
                    </span>
                    <NumberChain numbers={referenceVariation.grid.numbers} variant="number" />
                    <p className={styles.chainNote}>
                      Comparez les deux formes : mêmes principes de calcul, écarts différents. Cette variation n'est
                      pas présentée comme plus susceptible d'être tirée.
                    </p>
                  </div>
                )}
              </section>

              <section className={styles.section} data-testid="nearest-neighbors">
                <h2>Voisins historiques (proximité géométrique)</h2>
                <p className={styles.description}>
                  Les {NEIGHBOR_COUNT} tirages passés dont la forme géométrique (somme, écarts, répartition) est la
                  plus proche de la grille de référence - pas un graphe de proximité complet, mais la même donnée
                  sous-jacente.
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
