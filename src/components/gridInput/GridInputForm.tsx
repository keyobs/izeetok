import { useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import type { Grid } from '../../domain/grid/Grid.ts';
import { parseGrid } from '../../domain/grid/Grid.ts';
import styles from './GridInputForm.module.scss';

const NUMBER_MIN = 1;
const NUMBER_MAX = 50;
const STAR_MIN = 1;
const STAR_MAX = 12;

const EMPTY_NUMBERS = ['', '', '', '', ''];
const EMPTY_STARS = ['', ''];

const onlyDigits = (value: string): string => value.replace(/\D/g, '').slice(0, 2);

// A value repeated at an earlier index makes this (later) field invalid
// too, even if it's otherwise in range - a Grid needs 5 distinct numbers
// and 2 distinct stars, so only the *first* occurrence of a value can be
// valid.
const validityClass = (values: string[], index: number, min: number, max: number): string => {
  const value = values[index];
  if (value === '') return '';
  if (values.slice(0, index).includes(value)) return styles.inputInvalid;
  const parsed = Number(value);
  return parsed >= min && parsed <= max ? styles.inputValid : styles.inputInvalid;
};

interface GridInputFormProps {
  onSubmit: (grid: Grid) => void;
  submitLabel: string;
  submitButtonTestId?: string;
}

const GridInputForm = ({ onSubmit, submitLabel, submitButtonTestId = 'evaluate-button' }: GridInputFormProps) => {
  const [numberInputs, setNumberInputs] = useState<string[]>(EMPTY_NUMBERS);
  const [starInputs, setStarInputs] = useState<string[]>(EMPTY_STARS);
  const [error, setError] = useState<string | null>(null);

  const numberFieldRefs = useRef<(HTMLInputElement | null)[]>([]);
  const starFieldRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleSubmit = () => {
    const numbers = numberInputs.map(Number);
    const stars = starInputs.map(Number);

    if ([...numbers, ...stars].some((n) => Number.isNaN(n))) {
      setError('Merci de remplir les 5 numéros et les 2 étoiles.');
      return;
    }

    try {
      const grid = parseGrid({ numbers, stars });
      setError(null);
      onSubmit(grid);
    } catch {
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
    submitButtonRef.current,
  );

  return (
    <div className={styles.formWrapper}>
      <div className={styles.form} data-testid="grid-input-form">
        <fieldset>
          <legend>Numéros (1-50)</legend>
          {numberInputs.map((value, index) => (
            <input
              key={`number-${index}`}
              ref={(element) => {
                numberFieldRefs.current[index] = element;
              }}
              className={`${styles.numberInput} ${validityClass(numberInputs, index, NUMBER_MIN, NUMBER_MAX)}`}
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
              className={`${styles.numberInput} ${styles.starInput} ${validityClass(starInputs, index, STAR_MIN, STAR_MAX)}`}
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
        <button ref={submitButtonRef} type="button" onClick={handleSubmit} data-testid={submitButtonTestId}>
          {submitLabel}
        </button>
      </div>

      {error && (
        <p role="alert" className={styles.error} data-testid="grid-input-error">
          {error}
        </p>
      )}
    </div>
  );
};

export default GridInputForm;
