import type { Score } from '../../domain/scoring/evaluateGrid.ts';
import styles from './ScoreCard.module.scss';

interface ScoreCardProps {
  title: string;
  score: Score;
}

const ScoreCard = ({ title, score }: ScoreCardProps) => {
  return (
    <div className={styles.card} data-testid="score-card">
      <h3>{title}</h3>
      <p className={styles.value} data-testid="score-value">
        {score.value} / 100
      </p>
      <ul className={styles.factors}>
        {score.factors.map((factor) => (
          <li key={factor.label}>
            {factor.label}: {Math.round(factor.value * 100) / 100}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScoreCard;
