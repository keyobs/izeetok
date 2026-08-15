import { useMemo, useState } from 'react';
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
import ChartLegend from '../../components/chartLegend/ChartLegend.tsx';
import GridInputForm from '../../components/gridInput/GridInputForm.tsx';
import { drawRepository } from '../../api/drawRepositoryInstance.ts';
import { evaluatedGridRepository } from '../../providers/evaluatedGridRepositoryInstance.ts';
import { generateVariations } from '../../analysis/generateVariations.ts';
import { VARIATION_LABELS } from '../../analysis/variationLabels.ts';
import type { Draw } from '../../analysis/draw/Draw.ts';
import type { Grid } from '../../analysis/grid/Grid.ts';
import { extractFeatures } from '../../analysis/features/FeatureExtractor.ts';
import { buildGeometryDescriptor } from '../../analysis/geometry/GeometryDescriptor.ts';
import { findNearestNeighbors } from '../../analysis/geometry/nearestNeighbors.ts';
import styles from './GeometryPage.module.scss';

const DECADE_LABELS = ['1-10', '11-20', '21-30', '31-40', '41-50'];
const NEIGHBOR_COUNT = 10;
const EMPTY_DRAWS: Draw[] = [];

type ReferenceSource = 'latest' | 'evaluated' | 'custom';

const SOURCE_LABELS: Record<ReferenceSource, string> = {
  latest: 'Dernier tirage',
  evaluated: 'Grille évaluée',
  custom: 'Saisie libre',
};

const SOURCE_HINTS: Record<ReferenceSource, string> = {
  latest: 'Le dernier tirage officiel enregistré, pris comme exemple.',
  evaluated: "La grille que vous avez évaluée sur /evaluation.",
  custom: "Entrez n'importe quelle grille pour la situer dans l'historique.",
};

interface HighlightDotProps {
  cx?: number;
  cy?: number;
}

const HighlightDot = ({ cx, cy }: HighlightDotProps) => (
  <circle cx={cx} cy={cy} r={7} fill="var(--accent-reference)" stroke="var(--bg)" strokeWidth={2} />
);

interface DecadeBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: { hasReference: boolean };
}

const DecadeBar = ({ x = 0, y = 0, width = 0, height = 0, fill, payload }: DecadeBarProps) => (
  <g>
    <rect x={x} y={y} width={width} height={height} fill={fill} />
    {payload?.hasReference && (
      <circle cx={x + width / 2} cy={y - 8} r={5} fill="var(--accent-reference)" stroke="var(--bg)" strokeWidth={1.5} />
    )}
  </g>
);

const GeometryPage = () => {
  const drawsQuery = useQuery({
    queryKey: ['draws', 'all'],
    queryFn: () => drawRepository.getAll(),
  });
  const draws = drawsQuery.data ?? EMPTY_DRAWS;

  const evaluatedGrid = useMemo(() => evaluatedGridRepository.getLast(), []);

  const [source, setSource] = useState<ReferenceSource>(evaluatedGrid ? 'evaluated' : 'latest');
  const [customGrid, setCustomGrid] = useState<Grid | null>(null);

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

  const latestEntry = entries[0];
  const latestGrid: Grid | null = latestEntry ? { numbers: latestEntry.draw.numbers, stars: latestEntry.draw.stars } : null;

  const referenceGrid: Grid | null =
    source === 'latest' ? latestGrid : source === 'evaluated' ? evaluatedGrid : customGrid;

  const referenceDescriptor = useMemo(
    () => (referenceGrid ? buildGeometryDescriptor(referenceGrid) : null),
    [referenceGrid],
  );
  const referenceStdDev = useMemo(
    () => (referenceGrid ? extractFeatures(referenceGrid).values.stdDev : null),
    [referenceGrid],
  );

  const sumAmplitudeData = entries.map((entry) => ({ sum: entry.descriptor.sum, range: entry.descriptor.range }));
  const sumStdDevData = entries.map((entry) => ({ sum: entry.descriptor.sum, stdDev: entry.stdDev }));

  const decadeHistogram = DECADE_LABELS.map((label, index) => ({
    decade: label,
    count: entries.reduce((acc, entry) => acc + entry.descriptor.decadeBuckets[index], 0),
    hasReference: Boolean(referenceDescriptor && referenceDescriptor.decadeBuckets[index] > 0),
  }));

  const referenceSumAmplitude = referenceDescriptor
    ? [{ sum: referenceDescriptor.sum, range: referenceDescriptor.range }]
    : [];
  const referenceSumStdDev =
    referenceDescriptor && referenceStdDev != null ? [{ sum: referenceDescriptor.sum, stdDev: referenceStdDev }] : [];

  // Excludes the reference draw from its own neighbor candidates only when it
  // actually comes from the historical list ('latest') - an evaluated/custom
  // grid isn't part of `entries`, so nothing needs excluding for it.
  const neighborCandidates = source === 'latest' ? entries.slice(1) : entries;
  const neighbors = referenceDescriptor
    ? findNearestNeighbors(
        referenceDescriptor,
        neighborCandidates.map((entry) => ({ item: entry.draw, descriptor: entry.descriptor })),
        NEIGHBOR_COUNT,
      )
    : [];
  const maxNeighborDistance = neighbors.length > 0 ? Math.max(...neighbors.map((n) => n.distance)) : 0;

  const referenceVariation = useMemo(() => {
    if (!referenceGrid || draws.length === 0) return null;
    const [variation] = generateVariations(referenceGrid, draws);
    return variation ?? null;
  }, [referenceGrid, draws]);

  return (
    <div className={styles.page}>
      <h1>Géométrie</h1>
      <p className={styles.intro}>
        Cette page situe une grille - le dernier tirage, votre grille évaluée sur /evaluation, ou une
        saisie libre - au sein de l'historique complet des tirages, à travers plusieurs mesures
        géométriques (somme, amplitude, écart-type, répartition par dizaines, écarts entre numéros).
        Elle ne prédit rien : toutes les grilles ont la même probabilité théorique de sortir - elle
        sert seulement à comparer une forme à des formes déjà observées.
      </p>

      {drawsQuery.isLoading && <p>Chargement...</p>}

      <div className={styles.sourceSelector} role="radiogroup" aria-label="Grille de référence">
        {(Object.keys(SOURCE_LABELS) as ReferenceSource[]).map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="radio"
            aria-checked={source === candidate}
            className={source === candidate ? styles.sourceButtonActive : styles.sourceButton}
            onClick={() => setSource(candidate)}
            disabled={candidate === 'evaluated' && !evaluatedGrid}
            title={
              candidate === 'evaluated' && !evaluatedGrid
                ? 'Évaluez une grille sur /evaluation pour activer cette option'
                : undefined
            }
            data-testid={`reference-source-${candidate}`}
          >
            {SOURCE_LABELS[candidate]}
          </button>
        ))}
      </div>
      <p className={styles.sourceHint}>{SOURCE_HINTS[source]}</p>

      {source === 'custom' && (
        <GridInputForm
          onSubmit={setCustomGrid}
          submitLabel="Analyser cette grille"
          submitButtonTestId="custom-grid-submit"
        />
      )}

      {referenceGrid ? (
        <div className={styles.referenceBanner} data-testid="reference-grid-banner">
          <div className={styles.referenceMeta}>
            <span className={styles.referenceLabel}>Grille de référence</span>
            <span>{source === 'latest' ? latestEntry?.draw.date : SOURCE_LABELS[source]}</span>
          </div>
          <div className={styles.referenceBubbles}>
            {referenceGrid.numbers.map((n) => (
              <Bubble key={n} value={n} variant="number" />
            ))}
            {referenceGrid.stars.map((s) => (
              <Bubble key={s} value={s} variant="star" />
            ))}
          </div>
        </div>
      ) : (
        source === 'custom' && (
          <p className={styles.emptyCustomHint} data-testid="custom-grid-empty">
            Saisissez une grille ci-dessus pour l'analyser.
          </p>
        )
      )}

      {entries.length > 0 && (
        <>
          <section className={styles.section} data-testid="scatter-sum-amplitude">
            <h2>Somme × Amplitude</h2>
            <p className={styles.description}>
              Chaque point est un tirage historique : la somme des 5 numéros (axe horizontal) et l'amplitude, l'écart
              entre le plus petit et le plus grand numéro (axe vertical). Un point isolé, loin du nuage principal,
              signifie une somme ou une amplitude inhabituelle par rapport à l'historique - ça ne présage en rien de
              la suite.
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
            <ChartLegend
              items={[
                { color: '#7c6fd1', label: 'Tirages historiques' },
                { color: 'var(--accent-reference)', label: 'Grille de référence' },
              ]}
            />
          </section>

          <section className={styles.section} data-testid="scatter-sum-stddev">
            <h2>Somme × Écart-type</h2>
            <p className={styles.description}>
              Même principe, avec l'écart-type (axe vertical) : il mesure si les 5 numéros sont plutôt regroupés ou
              dispersés autour de leur moyenne. Là encore, un point excentré indique juste un profil rare dans
              l'historique, pas un signal prédictif.
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
            <ChartLegend
              items={[
                { color: '#4f9d8f', label: 'Tirages historiques' },
                { color: 'var(--accent-reference)', label: 'Grille de référence' },
              ]}
            />
          </section>

          <section className={styles.section} data-testid="decade-histogram">
            <h2>Histogramme des signatures de dizaines</h2>
            <p className={styles.description}>
              Sur tout l'historique, combien de numéros sont tombés dans chacune des cinq tranches de dizaines
              (1-10, 11-20, 21-30, 31-40, 41-50). Le repère au-dessus d'une barre indique les dizaines où tombent les
              numéros de la grille de référence - une barre plus haute que les autres reflète simplement une
              fréquence historique, pas une dizaine "due".
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={decadeHistogram}>
                <CartesianGrid />
                <XAxis dataKey="decade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#c17b4f" shape={DecadeBar} />
              </BarChart>
            </ResponsiveContainer>
            <ChartLegend
              items={[
                { color: '#c17b4f', label: 'Total historique par tranche' },
                { color: 'var(--accent-reference)', label: 'Dizaine(s) de la grille de référence' },
              ]}
            />
          </section>

          {referenceGrid && referenceDescriptor && (
            <>
              <section className={styles.section} data-testid="gap-map">
                <h2>Carte des écarts</h2>
                <p className={styles.description}>
                  Les 5 numéros d'une grille, dans l'ordre croissant, reliés par l'écart (la distance) qui les
                  sépare - une façon de visualiser sa "forme" plutôt que sa seule liste de numéros.
                </p>

                <div className={styles.chainGroup}>
                  <span className={styles.chainLabel}>
                    Grille de référence
                    {source === 'latest' && latestEntry ? ` (${latestEntry.draw.date})` : ''}
                  </span>
                  <NumberChain numbers={referenceGrid.numbers} variant="highlight" />
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
                  Ce ne sont pas les derniers tirages : ce sont, parmi tout l'historique, les {NEIGHBOR_COUNT} dont la
                  forme géométrique (somme, écarts, répartition) ressemble le plus à la grille de référence. Une
                  ressemblance de forme ne signifie pas une probabilité de sortie plus élevée pour l'un ou l'autre -
                  la barre ci-dessous représente juste cette proximité relative, du plus proche au moins proche.
                </p>
                <ul className={styles.neighborList}>
                  {neighbors.map((neighbor) => {
                    const proximity = maxNeighborDistance > 0 ? 1 - neighbor.distance / maxNeighborDistance : 1;
                    return (
                      <li key={neighbor.item.id} className={styles.neighborRow} data-testid="neighbor-row">
                        <span className={styles.neighborDate}>{neighbor.item.date}</span>
                        <div className={styles.neighborBubbles}>
                          {neighbor.item.numbers.map((n) => (
                            <Bubble key={n} value={n} variant="number" />
                          ))}
                        </div>
                        <div
                          className={styles.neighborProximity}
                          title={`distance ${neighbor.distance.toFixed(3)}`}
                          data-testid="neighbor-proximity"
                        >
                          <span
                            className={styles.neighborProximityFill}
                            style={{ width: `${Math.round(proximity * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
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
