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
import { VARIATION_LABELS } from '../../analysis/variationLabels.ts';
import type { GeometryPageViewModel, ReferenceSource } from './useGeometryPage.ts';
import { SOURCE_HINTS, SOURCE_LABELS } from './useGeometryPage.ts';
import HighlightDot from './HighlightDot.tsx';
import DecadeBar from './DecadeBar.tsx';
import styles from './GeometryPage.module.scss';

const NEIGHBOR_COUNT = 10;

const GeometryScreen = ({
  isLoading,
  hasEntries,
  source,
  onSourceChange,
  isEvaluatedSourceAvailable,
  onCustomGridSubmit,
  referenceGrid,
  latestEntryDate,
  sumAmplitudeData,
  referenceSumAmplitude,
  sumStdDevData,
  referenceSumStdDev,
  decadeHistogram,
  referenceVariation,
  neighbors,
  maxNeighborDistance,
}: GeometryPageViewModel) => (
  <div className={styles.page}>
    <h1>Géométrie</h1>
    <p className={styles.intro}>
      Cette page situe une grille - le dernier tirage, votre grille évaluée sur /evaluation, ou une
      saisie libre - au sein de l'historique complet des tirages, à travers plusieurs mesures
      géométriques (somme, amplitude, écart-type, répartition par dizaines, écarts entre numéros).
      Elle ne prédit rien : toutes les grilles ont la même probabilité théorique de sortir - elle
      sert seulement à comparer une forme à des formes déjà observées.
    </p>

    {isLoading && <p>Chargement...</p>}

    <div className={styles.sourceSelector} role="radiogroup" aria-label="Grille de référence">
      {(Object.keys(SOURCE_LABELS) as ReferenceSource[]).map((candidate) => (
        <button
          key={candidate}
          type="button"
          role="radio"
          aria-checked={source === candidate}
          className={source === candidate ? styles.sourceButtonActive : styles.sourceButton}
          onClick={() => onSourceChange(candidate)}
          disabled={candidate === 'evaluated' && !isEvaluatedSourceAvailable}
          title={
            candidate === 'evaluated' && !isEvaluatedSourceAvailable
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
        onSubmit={onCustomGridSubmit}
        submitLabel="Analyser cette grille"
        submitButtonTestId="custom-grid-submit"
      />
    )}

    {referenceGrid ? (
      <div className={styles.referenceBanner} data-testid="reference-grid-banner">
        <div className={styles.referenceMeta}>
          <span className={styles.referenceLabel}>Grille de référence</span>
          <span>{source === 'latest' ? latestEntryDate : SOURCE_LABELS[source]}</span>
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

    {hasEntries && (
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

        {referenceGrid && (
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
                  {source === 'latest' && latestEntryDate ? ` (${latestEntryDate})` : ''}
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

export default GeometryScreen;
