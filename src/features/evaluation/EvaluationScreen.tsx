import type { ReadingMatrixLabel } from '../../analysis/scoring/evaluateGrid.ts';
import { VARIATION_DESCRIPTIONS, VARIATION_LABELS } from '../../analysis/variationLabels.ts';
import GridInputForm from '../../components/gridInput/GridInputForm.tsx';
import type { EvaluationPageViewModel } from './useEvaluationPage.ts';
import ScoreCard from './ScoreCard.tsx';
import styles from './EvaluationPage.module.scss';

const READING_LABELS: Record<ReadingMatrixLabel, string> = {
  classique: 'Classique',
  interessante: 'Intéressante',
  atypique: 'Atypique',
  'tres-atypique': 'Très atypique',
};

const EvaluationScreen = ({
  grid,
  onGridSubmit,
  isHistoryLoading,
  scores,
  reading,
  exactMatch,
  numbersOnlyMatches,
  earliestDrawDate,
  variations,
}: EvaluationPageViewModel) => (
  <div className={styles.page}>
    <h1>Évaluation d'une grille</h1>

    <GridInputForm
      onSubmit={onGridSubmit}
      submitLabel="Évaluer"
      submitButtonTestId="evaluate-button"
      initialGrid={grid}
    />

    {isHistoryLoading && <p>Chargement de l'historique...</p>}

    {scores && reading && (
      <section data-testid="evaluation-results">
        <p data-testid="reading-matrix">Lecture : {READING_LABELS[reading]}</p>
        {earliestDrawDate && (
          <p data-testid="exact-match-banner" className={styles.exactMatch}>
            {exactMatch
              ? `Cette grille est déjà sortie le ${exactMatch.date} — la retirer ne change rien à ses chances de sortir à nouveau.`
              : `Cette grille n'est jamais sortie dans l'historique disponible (depuis ${earliestDrawDate}) — comme la grande majorité des combinaisons possibles.`}
          </p>
        )}
        {numbersOnlyMatches.length > 0 && (
          <p data-testid="numbers-only-match-banner" className={styles.exactMatch}>
            Les 5 numéros de cette grille sont déjà sortis, avec des étoiles différentes :{' '}
            {numbersOnlyMatches.map((draw) => draw.date).join(', ')}.
          </p>
        )}
        <div className={styles.scores}>
          <ScoreCard title="Structure historique" score={scores.structure} accent="structure" />
          <ScoreCard title="Originalité estimée" score={scores.originality} accent="originality" />
          <ScoreCard title="Temporalité" score={scores.temporal} accent="temporal" />
          <ScoreCard title="Confiance" score={scores.confidence} accent="confidence" />
        </div>
      </section>
    )}

    {variations.length > 0 && (
      <section data-testid="variations">
        <h2>Variations</h2>
        <p className={styles.variationsNote}>
          Ces variations ne sont pas présentées comme plus susceptibles d'être tirées : toutes les
          grilles valides ont la même probabilité théorique.
        </p>
        <ul className={styles.variationsList}>
          {variations.map((variation) => (
            <li key={variation.kind} className={styles.variationItem} data-testid={`variation-${variation.kind}`}>
              <div className={styles.variationHeader}>
                <span className={styles.variationLabel}>{VARIATION_LABELS[variation.kind]}</span>
                <span>
                  {variation.grid.numbers.join(' · ')} — étoiles {variation.grid.stars.join(' · ')}
                </span>
              </div>
              <p className={styles.variationDescription}>{VARIATION_DESCRIPTIONS[variation.kind]}</p>
              <div className={styles.variationScores} data-testid="variation-scores">
                <span className={styles.variationScore}>
                  <i className={styles.dotStructure} />
                  Structure historique : {variation.scores.structure.value}
                </span>
                <span className={styles.variationScore}>
                  <i className={styles.dotOriginality} />
                  Originalité estimée : {variation.scores.originality.value}
                </span>
                <span className={styles.variationScore}>
                  <i className={styles.dotTemporal} />
                  Temporalité : {variation.scores.temporal.value}
                </span>
                <span className={styles.variationScore}>
                  <i className={styles.dotConfidence} />
                  Confiance : {variation.scores.confidence.value}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    )}
  </div>
);

export default EvaluationScreen;
