import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Draw } from '../../domain/draw/Draw.ts';
import type { VariationKind } from '../../application/generateVariations.ts';
import { generateVariations } from '../../application/generateVariations.ts';
import { drawRepository } from '../../application/drawRepository.ts';
import type { Grid } from '../../domain/grid/Grid.ts';
import { parseGrid } from '../../domain/grid/Grid.ts';
import type { EvaluationScores, ReadingMatrixLabel } from '../../domain/scoring/evaluateGrid.ts';
import { classifyReading, evaluateGrid } from '../../domain/scoring/evaluateGrid.ts';
import ScoreCard from './ScoreCard.tsx';
import styles from './EvaluationPage.module.scss';

const EMPTY_NUMBERS = ['', '', '', '', ''];
const EMPTY_STARS = ['', ''];
const EMPTY_HISTORY: Draw[] = [];

const READING_LABELS: Record<ReadingMatrixLabel, string> = {
  classique: 'Classique',
  interessante: 'Intéressante',
  atypique: 'Atypique',
  'tres-atypique': 'Très atypique',
};

const VARIATION_LABELS: Record<VariationKind, string> = {
  'structurally-common': 'Structurellement courante',
  balanced: 'Équilibrée',
  'anti-share': 'Anti-partage',
};

const EvaluationPage = () => {
  const [numberInputs, setNumberInputs] = useState<string[]>(EMPTY_NUMBERS);
  const [starInputs, setStarInputs] = useState<string[]>(EMPTY_STARS);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [error, setError] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ['draws', 'all'],
    queryFn: () => drawRepository.getAll(),
  });
  const history = historyQuery.data ?? EMPTY_HISTORY;

  const handleNumberChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNumberInputs((previous) => previous.map((current, i) => (i === index ? value : current)));
  };

  const handleStarChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setStarInputs((previous) => previous.map((current, i) => (i === index ? value : current)));
  };

  const handleEvaluate = () => {
    const numbers = numberInputs.map(Number);
    const stars = starInputs.map(Number);

    if ([...numbers, ...stars].some((n) => Number.isNaN(n))) {
      setGrid(null);
      setError('Merci de remplir les 5 numéros et les 2 étoiles.');
      return;
    }

    try {
      setGrid(parseGrid({ numbers, stars }));
      setError(null);
    } catch {
      setGrid(null);
      setError('Grille invalide : 5 numéros distincts entre 1 et 50, 2 étoiles distinctes entre 1 et 12.');
    }
  };

  const scores = useMemo<EvaluationScores | null>(
    () => (grid && history.length > 0 ? evaluateGrid(grid, history) : null),
    [grid, history],
  );
  const variations = useMemo(
    () => (grid && history.length > 0 ? generateVariations(grid, history) : []),
    [grid, history],
  );
  const reading = scores ? classifyReading(scores) : null;

  return (
    <div className={styles.page}>
      <h1>Évaluation d'une grille</h1>

      <div className={styles.form} data-testid="evaluation-form">
        <fieldset>
          <legend>Numéros (1-50)</legend>
          {numberInputs.map((value, index) => (
            <input
              key={`number-${index}`}
              className={styles.numberInput}
              type="number"
              min={1}
              max={50}
              value={value}
              onChange={handleNumberChange(index)}
              data-testid={`number-input-${index}`}
              aria-label={`Numéro ${index + 1}`}
            />
          ))}
        </fieldset>
        <fieldset>
          <legend>Étoiles (1-12)</legend>
          {starInputs.map((value, index) => (
            <input
              key={`star-${index}`}
              className={styles.numberInput}
              type="number"
              min={1}
              max={12}
              value={value}
              onChange={handleStarChange(index)}
              data-testid={`star-input-${index}`}
              aria-label={`Étoile ${index + 1}`}
            />
          ))}
        </fieldset>
        <button type="button" onClick={handleEvaluate} data-testid="evaluate-button">
          Évaluer
        </button>
      </div>

      {error && (
        <p role="alert" className={styles.error} data-testid="evaluation-error">
          {error}
        </p>
      )}

      {historyQuery.isLoading && <p>Chargement de l'historique...</p>}

      {scores && reading && (
        <section data-testid="evaluation-results">
          <p data-testid="reading-matrix">Lecture : {READING_LABELS[reading]}</p>
          <div className={styles.scores}>
            <ScoreCard title="Structure historique" score={scores.structure} />
            <ScoreCard title="Originalité estimée" score={scores.originality} />
            <ScoreCard title="Temporalité" score={scores.temporal} />
            <ScoreCard title="Confiance" score={scores.confidence} />
          </div>
        </section>
      )}

      {variations.length > 0 && (
        <section data-testid="variations">
          <h2>Variations</h2>
          <p>
            Ces variations ne sont pas présentées comme plus susceptibles d'être tirées : toutes les
            grilles valides ont la même probabilité théorique.
          </p>
          <ul>
            {variations.map((variation) => (
              <li key={variation.kind} data-testid={`variation-${variation.kind}`}>
                {VARIATION_LABELS[variation.kind]} : {variation.grid.numbers.join(' · ')} — étoiles{' '}
                {variation.grid.stars.join(' · ')}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default EvaluationPage;
