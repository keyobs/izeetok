import type { Grid } from '../../analysis/grid/Grid.ts';
import type { FieldValidity } from './useGridInput.ts';
import { useGridInput } from './useGridInput.ts';
import styles from './GridInputForm.module.scss';

interface GridInputFormProps {
  onSubmit: (grid: Grid) => void;
  submitLabel: string;
  submitButtonTestId?: string;
  initialGrid?: Grid | null;
}

const validityClassName = (validity: FieldValidity): string => {
  if (validity === 'valid') return styles.inputValid;
  if (validity === 'invalid') return styles.inputInvalid;
  return '';
};

const GridInputForm = ({
  onSubmit,
  submitLabel,
  submitButtonTestId = 'evaluate-button',
  initialGrid = null,
}: GridInputFormProps) => {
  const {
    numberInputs,
    starInputs,
    numberValidities,
    starValidities,
    error,
    numberFieldRefs,
    starFieldRefs,
    submitButtonRef,
    handleNumberChange,
    handleNumberKeyDown,
    handleStarChange,
    handleStarKeyDown,
    handleSubmit,
    handleFormKeyDown,
  } = useGridInput({ onSubmit, initialGrid });

  return (
    <div className={styles.formWrapper}>
      <div className={styles.form} data-testid="grid-input-form" onKeyDown={handleFormKeyDown}>
        <fieldset>
          <legend>Numéros (1-50)</legend>
          {numberInputs.map((value, index) => (
            <input
              key={`number-${index}`}
              ref={(element) => {
                numberFieldRefs.current[index] = element;
              }}
              className={`${styles.numberInput} ${validityClassName(numberValidities[index])}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              autoComplete="off"
              value={value}
              onChange={handleNumberChange(index)}
              onKeyDown={handleNumberKeyDown(index)}
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
              className={`${styles.numberInput} ${styles.starInput} ${validityClassName(starValidities[index])}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              autoComplete="off"
              value={value}
              onChange={handleStarChange(index)}
              onKeyDown={handleStarKeyDown(index)}
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
