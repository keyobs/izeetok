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
            <span>{factor.label}</span>
            <span>{Math.round(factor.value * 100) / 100}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScoreCard;
