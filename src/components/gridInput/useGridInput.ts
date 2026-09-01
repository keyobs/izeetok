import { useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MutableRefObject } from 'react';
import type { Grid } from '../../analysis/grid/Grid.ts';
import { parseGrid } from '../../analysis/grid/Grid.ts';

const NUMBER_MIN = 1;
const NUMBER_MAX = 50;
const STAR_MIN = 1;
const STAR_MAX = 12;

const EMPTY_NUMBERS = ['', '', '', '', ''];
const EMPTY_STARS = ['', ''];

const onlyDigits = (value: string): string => value.replace(/\D/g, '').slice(0, 2);

export type FieldValidity = 'empty' | 'valid' | 'invalid';

// A value repeated at an earlier index makes this (later) field invalid
// too, even if it's otherwise in range - a Grid needs 5 distinct numbers
// and 2 distinct stars, so only the *first* occurrence of a value can be
// valid.
const fieldValidity = (values: string[], index: number, min: number, max: number): FieldValidity => {
  const value = values[index];
  if (value === '') return 'empty';
  if (values.slice(0, index).includes(value)) return 'invalid';
  const parsed = Number(value);
  return parsed >= min && parsed <= max ? 'valid' : 'invalid';
};

export interface UseGridInputParams {
  onSubmit: (grid: Grid) => void;
  initialGrid?: Grid | null;
}

export interface UseGridInputResult {
  numberInputs: string[];
  starInputs: string[];
  numberValidities: FieldValidity[];
  starValidities: FieldValidity[];
  error: string | null;
  numberFieldRefs: MutableRefObject<(HTMLInputElement | null)[]>;
  starFieldRefs: MutableRefObject<(HTMLInputElement | null)[]>;
  submitButtonRef: MutableRefObject<HTMLButtonElement | null>;
  handleNumberChange: (index: number) => (event: ChangeEvent<HTMLInputElement>) => void;
  handleNumberKeyDown: (index: number) => (event: KeyboardEvent<HTMLInputElement>) => void;
  handleStarChange: (index: number) => (event: ChangeEvent<HTMLInputElement>) => void;
  handleStarKeyDown: (index: number) => (event: KeyboardEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  handleFormKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export const useGridInput = ({ onSubmit, initialGrid = null }: UseGridInputParams): UseGridInputResult => {
  const [numberInputs, setNumberInputs] = useState<string[]>(
    initialGrid ? initialGrid.numbers.map(String) : EMPTY_NUMBERS,
  );
  const [starInputs, setStarInputs] = useState<string[]>(
    initialGrid ? initialGrid.stars.map(String) : EMPTY_STARS,
  );
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

  const handleFormKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') handleSubmit();
  };

  return {
    numberInputs,
    starInputs,
    numberValidities: numberInputs.map((_, index) => fieldValidity(numberInputs, index, NUMBER_MIN, NUMBER_MAX)),
    starValidities: starInputs.map((_, index) => fieldValidity(starInputs, index, STAR_MIN, STAR_MAX)),
    error,
    numberFieldRefs,
    starFieldRefs,
    submitButtonRef,
    handleNumberChange: numberHandlers.onChange,
    handleNumberKeyDown: numberHandlers.onKeyDown,
    handleStarChange: starHandlers.onChange,
    handleStarKeyDown: starHandlers.onKeyDown,
    handleSubmit,
    handleFormKeyDown,
  };
};
