import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Draw } from '../../domain/draw/Draw.ts';
import { generateVariations } from '../../application/generateVariations.ts';
import { VARIATION_DESCRIPTIONS, VARIATION_LABELS } from '../../application/variationLabels.ts';
import { drawRepository } from '../../application/drawRepository.ts';
import { evaluatedGridRepository } from '../../application/evaluatedGridRepository.ts';
import type { Grid } from '../../domain/grid/Grid.ts';
import type { EvaluationScores, ReadingMatrixLabel } from '../../domain/scoring/evaluateGrid.ts';
import { classifyReading, evaluateGrid } from '../../domain/scoring/evaluateGrid.ts';
import { findExactMatch } from '../../domain/draw/findExactMatch.ts';
import GridInputForm from '../../components/gridInput/GridInputForm.tsx';
import ScoreCard from './ScoreCard.tsx';
import styles from './EvaluationPage.module.scss';

const EMPTY_HISTORY: Draw[] = [];

const READING_LABELS: Record<ReadingMatrixLabel, string> = {
  classique: 'Classique',
  interessante: 'Intéressante',
  atypique: 'Atypique',
  'tres-atypique': 'Très atypique',
};

const EvaluationPage = () => {
  const [grid, setGrid] = useState<Grid | null>(null);

  const historyQuery = useQuery({
    queryKey: ['draws', 'all'],
    queryFn: () => drawRepository.getAll(),
  });
  const history = historyQuery.data ?? EMPTY_HISTORY;

  const handleGridSubmit = (submittedGrid: Grid) => {
    setGrid(submittedGrid);
    evaluatedGridRepository.save(submittedGrid);
  };

  const scores = useMemo<EvaluationScores | null>(
    () => (grid && history.length > 0 ? evaluateGrid(grid, history) : null),
    [grid, history],
  );
  const variations = useMemo(
    () =>
      grid && history.length > 0
        ? generateVariations(grid, history).map((variation) => ({
            ...variation,
            scores: evaluateGrid(variation.grid, history),
          }))
        : [],
    [grid, history],
  );
  const reading = scores ? classifyReading(scores) : null;

  const exactMatch = useMemo(
    () => (grid && history.length > 0 ? findExactMatch(grid, history) : null),
    [grid, history],
  );
  const earliestDrawDate = useMemo(
    () =>
      history.length === 0
        ? null
        : history.reduce((earliest, draw) => (draw.date < earliest ? draw.date : earliest), history[0].date),
    [history],
  );

  return (
    <div className={styles.page}>
      <h1>Évaluation d'une grille</h1>

      <GridInputForm onSubmit={handleGridSubmit} submitLabel="Évaluer" submitButtonTestId="evaluate-button" />

      {historyQuery.isLoading && <p>Chargement de l'historique...</p>}

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
};

export default EvaluationPage;
