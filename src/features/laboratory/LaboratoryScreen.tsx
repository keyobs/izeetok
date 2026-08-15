import type { ChangeEvent } from 'react';
import { TEMPORAL_WINDOWS } from '../../analysis/scoring/TemporalWindow.ts';
import ExperimentResults from './ExperimentResults.tsx';
import { RULE_KINDS, RULE_LABELS, SCORING_KINDS } from './strategyFormRules.ts';
import { windowLabel } from './windowLabel.ts';
import type { LaboratoryPageViewModel } from './useLaboratoryPage.ts';
import styles from './LaboratoryPage.module.scss';

const LaboratoryScreen = ({
  strategyName,
  setStrategyName,
  seed,
  setSeed,
  rulesState,
  updateRule,
  trainPercent,
  setTrainPercent,
  validationPercent,
  setValidationPercent,
  testPercent,
  selectedWindows,
  toggleWindow,
  monteCarloSampleCount,
  setMonteCarloSampleCount,
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

    <section className={styles.section} data-testid="strategy-builder">
      <h2>Construire une stratégie</h2>
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
            value={seed}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSeed(Number(event.target.value))}
            data-testid="seed-input"
          />
        </label>
      </div>

      <fieldset>
        <legend>Règles</legend>
        {RULE_KINDS.map((kind) => {
          const config = rulesState[kind];
          return (
            <div key={kind} className={styles.ruleRow}>
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
                  step={0.1}
                  value={config.weight}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => updateRule(kind, { weight: Number(event.target.value) })}
                  aria-label={`Poids - ${RULE_LABELS[kind]}`}
                  data-testid={`rule-weight-${kind}`}
                />
              )}
              {config.enabled && kind === 'sum-range' && (
                <>
                  <input
                    type="number"
                    value={config.min}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateRule(kind, { min: Number(event.target.value) })}
                    aria-label="Somme minimum"
                  />
                  <input
                    type="number"
                    value={config.max}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateRule(kind, { max: Number(event.target.value) })}
                    aria-label="Somme maximum"
                  />
                </>
              )}
              {config.enabled && kind === 'parity-target' && (
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={config.oddCount}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => updateRule(kind, { oddCount: Number(event.target.value) })}
                  aria-label="Nombre de numéros impairs souhaité"
                />
              )}
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
            value={trainPercent}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setTrainPercent(Number(event.target.value))}
            data-testid="train-percent-input"
          />
        </label>
        <label>
          Validation %
          <br />
          <input
            type="number"
            value={validationPercent}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setValidationPercent(Number(event.target.value))}
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
          value={monteCarloSampleCount}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setMonteCarloSampleCount(Number(event.target.value))}
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
