import type { ChangeEvent } from 'react';
import { TEMPORAL_WINDOWS } from '../../analysis/scoring/TemporalWindow.ts';
import DataLoadError from '../../components/dataLoadError/DataLoadError.tsx';
import ExperimentResults from './ExperimentResults.tsx';
import {
  ODD_COUNT_MAX,
  ODD_COUNT_MIN,
  RULE_DESCRIPTIONS,
  RULE_KINDS,
  RULE_LABELS,
  SCORING_KINDS,
  SUM_MAX,
  SUM_MIN,
  WEIGHT_MAX,
  WEIGHT_MIN,
} from './strategyFormRules.ts';
import { windowLabel } from './windowLabel.ts';
import type { LaboratoryPageViewModel } from './useLaboratoryPage.ts';
import { MONTE_CARLO_MAX, MONTE_CARLO_MIN, PERCENT_MAX, PERCENT_MIN, SEED_MAX, SEED_MIN } from './useLaboratoryPage.ts';
import styles from './LaboratoryPage.module.scss';

const LaboratoryScreen = ({
  isDrawsError,
  onRetryDraws,
  strategyName,
  setStrategyName,
  seed,
  onSeedChange,
  rulesState,
  updateRule,
  trainPercent,
  onTrainPercentChange,
  validationPercent,
  onValidationPercentChange,
  testPercent,
  selectedWindows,
  toggleWindow,
  monteCarloSampleCount,
  onMonteCarloSampleCountChange,
  experiments,
  selectedExperiment,
  onSelectExperiment,
  onRunExperiment,
  onExportExperiment,
}: LaboratoryPageViewModel) => (
  <div className={styles.page}>
    <h1>Laboratoire de stratégies</h1>
    <p className={styles.intro}>
      Cette hypothèse fait-elle mieux qu'une stratégie de référence lorsqu'on la teste correctement ?
    </p>

    {isDrawsError && <DataLoadError onRetry={onRetryDraws} />}

    <section className={styles.section} data-testid="strategy-builder">
      <h2>Construire une stratégie</h2>
      <p className={styles.sectionIntro}>
        Une stratégie est un ensemble de règles qui influencent la sélection des 5 numéros et 2
        étoiles proposés lors du backtest ci-dessous. Active celles qui t'intéressent, ajuste leur
        poids si besoin, puis lance le backtest pour voir si cette combinaison fait mieux qu'une
        génération aléatoire sur l'historique réel des tirages.
      </p>
      <div className={styles.formRow}>
        <label>
          Nom
          <br />
          <input
            value={strategyName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setStrategyName(event.target.value)}
            data-testid="strategy-name-input"
          />
        </label>
        <label>
          Seed
          <br />
          <input
            type="number"
            min={SEED_MIN}
            max={SEED_MAX}
            step={1}
            value={seed}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSeedChange(event.target.value)}
            data-testid="seed-input"
          />
        </label>
      </div>
      <p className={styles.fieldHint}>
        Le seed pilote le tirage au sort interne : à règles égales, le même seed reproduit
        exactement la même proposition — change-le pour explorer d'autres possibilités.
      </p>

      <fieldset>
        <legend>Règles</legend>
        <p className={styles.fieldHint}>
          Le poids détermine l'importance d'une règle dans la sélection : plus sa valeur absolue est
          grande, plus elle pèse. Un poids négatif inverse l'effet de la règle.
        </p>
        {RULE_KINDS.map((kind) => {
          const config = rulesState[kind];
          return (
            <div key={kind} className={styles.ruleRow}>
              <div className={styles.ruleControls}>
                <label>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateRule(kind, { enabled: event.target.checked })}
                    data-testid={`rule-toggle-${kind}`}
                  />
                  {RULE_LABELS[kind]}
                </label>
                {config.enabled && SCORING_KINDS.includes(kind) && (
                  <input
                    type="number"
                    min={WEIGHT_MIN}
                    max={WEIGHT_MAX}
                    step={1}
                    value={config.weight}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateRule(kind, { weight: event.target.value })}
                    aria-label={`Poids - ${RULE_LABELS[kind]}`}
                    data-testid={`rule-weight-${kind}`}
                  />
                )}
                {config.enabled && kind === 'sum-range' && (
                  <>
                    <input
                      type="number"
                      min={SUM_MIN}
                      max={SUM_MAX}
                      step={1}
                      value={config.min}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => updateRule(kind, { min: event.target.value })}
                      aria-label="Somme minimum"
                    />
                    <input
                      type="number"
                      min={SUM_MIN}
                      max={SUM_MAX}
                      step={1}
                      value={config.max}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => updateRule(kind, { max: event.target.value })}
                      aria-label="Somme maximum"
                    />
                  </>
                )}
                {config.enabled && kind === 'parity-target' && (
                  <input
                    type="number"
                    min={ODD_COUNT_MIN}
                    max={ODD_COUNT_MAX}
                    step={1}
                    value={config.oddCount}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateRule(kind, { oddCount: event.target.value })}
                    aria-label="Nombre de numéros impairs souhaité"
                  />
                )}
              </div>
              <p className={styles.ruleDescription}>{RULE_DESCRIPTIONS[kind]}</p>
            </div>
          );
        })}
      </fieldset>
    </section>

    <section className={styles.section} data-testid="experiment-config">
      <h2>Configuration de l'expérience</h2>
      <div className={styles.formRow}>
        <label>
          Train %
          <br />
          <input
            type="number"
            min={PERCENT_MIN}
            max={PERCENT_MAX}
            step={1}
            value={trainPercent}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onTrainPercentChange(event.target.value)}
            data-testid="train-percent-input"
          />
        </label>
        <label>
          Validation %
          <br />
          <input
            type="number"
            min={PERCENT_MIN}
            max={PERCENT_MAX}
            step={1}
            value={validationPercent}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onValidationPercentChange(event.target.value)}
            data-testid="validation-percent-input"
          />
        </label>
        <p data-testid="test-percent-display">Test : {testPercent}%</p>
      </div>

      <fieldset>
        <legend>Fenêtres temporelles (aucune n'a de statut privilégié)</legend>
        <div className={styles.windowChecks}>
          {TEMPORAL_WINDOWS.map((window) => (
            <label key={String(window)}>
              <input
                type="checkbox"
                checked={selectedWindows.includes(window)}
                onChange={() => toggleWindow(window)}
                data-testid={`window-toggle-${window}`}
              />
              {windowLabel(window)}
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        Échantillons Monte Carlo
        <br />
        <input
          type="number"
          min={MONTE_CARLO_MIN}
          max={MONTE_CARLO_MAX}
          step={1}
          value={monteCarloSampleCount}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onMonteCarloSampleCountChange(event.target.value)}
          data-testid="monte-carlo-samples-input"
        />
      </label>

      <p>
        <button type="button" onClick={onRunExperiment} data-testid="run-experiment-button">
          Lancer le backtest
        </button>
      </p>
    </section>

    {experiments.length > 0 && (
      <section className={styles.section} data-testid="experiments-list">
        <h2>Expériences de cette session ({experiments.length})</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Stratégie</th>
                <th>Seed</th>
                <th>Numéros moy. (test)</th>
                <th>Percentile Monte Carlo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {experiments.map((experiment) => (
                <tr key={experiment.id} data-testid="experiment-row">
                  <td>{experiment.strategy.name}</td>
                  <td>{experiment.seed}</td>
                  <td>{experiment.results.metrics.meanMatchedNumbers.toFixed(2)}</td>
                  <td>{experiment.monteCarlo.strategyPercentile.toFixed(0)}e</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onSelectExperiment(experiment.id)}
                      data-testid="select-experiment-button"
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )}

    {selectedExperiment && <ExperimentResults experiment={selectedExperiment} onExport={onExportExperiment} />}
  </div>
);

export default LaboratoryScreen;
