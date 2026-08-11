import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
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

const NUMBER_MIN = 1;
const NUMBER_MAX = 50;
const STAR_MIN = 1;
const STAR_MAX = 12;

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

const VARIATION_DESCRIPTIONS: Record<VariationKind, string> = {
  'structurally-common':
    'Reproduit un profil (somme, répartition par dizaine, écarts) proche des tirages historiquement fréquents.',
  balanced:
    'Répartit les numéros sur les cinq dizaines et équilibre pairs/impairs, pour une grille aux caractéristiques neutres.',
  'anti-share':
    'Moins de chance de partager un gain, car elle évite les numéros calendaires (≤31) que beaucoup de joueurs choisissent - cela ne change pas vos chances de gagner.',
};

const onlyDigits = (value: string): string => value.replace(/\D/g, '').slice(0, 2);

const validityClass = (value: string, min: number, max: number): string => {
  if (value === '') return '';
  const parsed = Number(value);
  return parsed >= min && parsed <= max ? styles.inputValid : styles.inputInvalid;
};

const EvaluationPage = () => {
  const [numberInputs, setNumberInputs] = useState<string[]>(EMPTY_NUMBERS);
  const [starInputs, setStarInputs] = useState<string[]>(EMPTY_STARS);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [error, setError] = useState<string | null>(null);

  const numberFieldRefs = useRef<(HTMLInputElement | null)[]>([]);
  const starFieldRefs = useRef<(HTMLInputElement | null)[]>([]);
  const evaluateButtonRef = useRef<HTMLButtonElement | null>(null);

  const historyQuery = useQuery({
    queryKey: ['draws', 'all'],
    queryFn: () => drawRepository.getAll(),
  });
  const history = historyQuery.data ?? EMPTY_HISTORY;

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

  // Lottery-ball-style entry: plain digit typing, auto-advance once a field
  // is full, backspace on an empty field jumps back - avoids the classic
  // type="number" pitfalls (spinner arrows, scroll-wheel changes value).
  const createDigitFieldHandlers = (
    values: string[],
    setValues: (updater: (previous: string[]) => string[]) => void,
    refs: (HTMLInputElement | null)[],
    nextFieldRef: HTMLElement | null,
  ) => ({
    onChange: (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
      const digits = onlyDigits(event.target.value);
      setValues((previous) => previous.map((current, i) => (i === index ? digits : current)));
      if (digits.length === 2) {
        (refs[index + 1] ?? nextFieldRef)?.focus();
      }
    },
    onKeyDown: (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && values[index] === '' && index > 0) {
        refs[index - 1]?.focus();
      }
    },
  });

  const numberHandlers = createDigitFieldHandlers(
    numberInputs,
    (updater) => setNumberInputs(updater),
    numberFieldRefs.current,
    starFieldRefs.current[0] ?? null,
  );
  const starHandlers = createDigitFieldHandlers(
    starInputs,
    (updater) => setStarInputs(updater),
    starFieldRefs.current,
    evaluateButtonRef.current,
  );

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

  return (
    <div className={styles.page}>
      <h1>Évaluation d'une grille</h1>

      <div className={styles.form} data-testid="evaluation-form">
        <fieldset>
          <legend>Numéros (1-50)</legend>
          {numberInputs.map((value, index) => (
            <input
              key={`number-${index}`}
              ref={(element) => {
                numberFieldRefs.current[index] = element;
              }}
              className={`${styles.numberInput} ${validityClass(value, NUMBER_MIN, NUMBER_MAX)}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              autoComplete="off"
              value={value}
              onChange={numberHandlers.onChange(index)}
              onKeyDown={numberHandlers.onKeyDown(index)}
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
              ref={(element) => {
                starFieldRefs.current[index] = element;
              }}
              className={`${styles.numberInput} ${styles.starInput} ${validityClass(value, STAR_MIN, STAR_MAX)}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              autoComplete="off"
              value={value}
              onChange={starHandlers.onChange(index)}
              onKeyDown={starHandlers.onKeyDown(index)}
              data-testid={`star-input-${index}`}
              aria-label={`Étoile ${index + 1}`}
            />
          ))}
        </fieldset>
        <button ref={evaluateButtonRef} type="button" onClick={handleEvaluate} data-testid="evaluate-button">
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
