import type { Score } from '../../domain/scoring/evaluateGrid.ts';
import styles from './ScoreCard.module.scss';

export type ScoreAccent = 'structure' | 'originality' | 'temporal' | 'confidence';

interface ScoreCardProps {
  title: string;
  score: Score;
  accent: ScoreAccent;
}

const ACCENT_CLASSES: Record<ScoreAccent, string> = {
  structure: styles.accentStructure,
  originality: styles.accentOriginality,
  temporal: styles.accentTemporal,
  confidence: styles.accentConfidence,
};

const ACCENT_DESCRIPTIONS: Record<ScoreAccent, string> = {
  structure:
    "Indique si la forme de cette grille (somme, écarts, répartition par dizaine) ressemble aux tirages historiques les plus courants.",
  originality:
    "Évalue si cette grille correspond à des choix populaires chez les joueurs (dates, numéros consécutifs...) - sans effet sur vos chances réelles de gagner.",
  temporal: "Compare cette grille aux tirages récents, sur des périodes allant d'un an à tout l'historique.",
  confidence:
    'Indique la fiabilité du diagnostic ci-dessus : plus les tirages proches de cette grille sont cohérents entre eux, plus la confiance est élevée.',
};

const FACTOR_LABELS: Record<string, string> = {
  meanNeighborDistance: 'Distance moyenne aux tirages proches',
  sumPercentile: 'Percentile de la somme',
  amplitudePercentile: "Percentile de l'amplitude",
  decadeSignatureMatchRate: 'Tirages avec la même répartition par dizaine',
  parityMatchRate: 'Tirages avec la même répartition pair/impair',
  consecutivePairsCount: 'Numéros consécutifs',
  sameUnitsPairsCount: 'Numéros finissant par le même chiffre',
  multiplesOfFiveCount: 'Multiples de 5',
  aboveThirtyOneCount: 'Numéros supérieurs à 31',
  window_1: 'Sur 1 an',
  window_3: 'Sur 3 ans',
  window_6: 'Sur 6 ans',
  window_12: 'Sur 12 ans',
  window_25: 'Sur 25 ans',
  window_50: 'Sur 50 ans',
  window_all: "Sur tout l'historique",
  sampleSize: 'Nombre de tirages analysés',
  neighborMeanDistance: 'Distance moyenne aux tirages proches',
  neighborDistanceStdDev: 'Écart-type de cette distance',
};

const factorLabel = (rawLabel: string): string => FACTOR_LABELS[rawLabel] ?? rawLabel;

const ScoreCard = ({ title, score, accent }: ScoreCardProps) => {
  return (
    <div className={`${styles.card} ${ACCENT_CLASSES[accent]}`} data-testid="score-card">
      <h3>{title}</h3>
      <p className={styles.value} data-testid="score-value">
        {score.value}
        <span className={styles.valueMax}>/100</span>
      </p>
      <ul className={styles.factors}>
        {score.factors.map((factor) => (
          <li key={factor.label}>
            <span>{factorLabel(factor.label)}</span>
            <span>{Math.round(factor.value * 100) / 100}</span>
          </li>
        ))}
      </ul>
      <p className={styles.description}>{ACCENT_DESCRIPTIONS[accent]}</p>
    </div>
  );
};

export default ScoreCard;
