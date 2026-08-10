import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Experiment } from '../../application/runExperiment.ts';
import { buildHistogram } from './buildHistogram.ts';
import styles from './LaboratoryPage.module.scss';

interface ExperimentResultsProps {
  experiment: Experiment;
  onExport: (experiment: Experiment) => void;
}

const windowLabel = (window: Experiment['windows'][number]): string => (window === 'all' ? 'Tout' : `${window} an(s)`);

const ExperimentResults = ({ experiment, onExport }: ExperimentResultsProps) => {
  const histogramData = buildHistogram(experiment.monteCarlo.distribution, 10);
  const isNoAdvantageDetected = Math.abs(experiment.monteCarlo.strategyPercentile - 50) < 10;

  return (
    <section data-testid="experiment-results">
      <h2>Résultats — {experiment.strategy.name}</h2>

      {experiment.overfitting.isLikelyOverfit && (
        <p role="alert" className={styles.warning} data-testid="overfitting-warning">
          ⚠ Risque de surapprentissage : {experiment.overfitting.reason}
        </p>
      )}

      <div data-testid="metrics-summary">
        <p>
          Test — numéros trouvés en moyenne : {experiment.results.metrics.meanMatchedNumbers.toFixed(2)} / 5,
          étoiles : {experiment.results.metrics.meanMatchedStars.toFixed(2)} / 2
        </p>
        <p>Meilleur rang obtenu sur la période de test : {experiment.results.metrics.bestPrizeRank ?? 'aucun'}</p>
        <p>
          Train : {experiment.overfitting.trainMeanMatchedNumbers.toFixed(2)} — Validation :{' '}
          {experiment.overfitting.validationMeanMatchedNumbers.toFixed(2)} — Test :{' '}
          {experiment.overfitting.testMeanMatchedNumbers.toFixed(2)}
        </p>
      </div>

      <div data-testid="baseline-comparison">
        <h3>Comparaison aux références</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Numéros moy.</th>
              <th>Étoiles moy.</th>
            </tr>
          </thead>
          <tbody>
            {experiment.results.baselineComparisons.map((baseline) => (
              <tr key={baseline.baselineName}>
                <td>{baseline.baselineName}</td>
                <td>{baseline.meanMatchedNumbers.toFixed(2)}</td>
                <td>{baseline.meanMatchedStars.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div data-testid="monte-carlo">
        <h3>Simulation Monte Carlo</h3>
        <p>
          Percentile de la stratégie testée : {experiment.monteCarlo.strategyPercentile.toFixed(1)}e sur{' '}
          {experiment.monteCarlo.sampleCount} stratégies aléatoires équivalentes.
        </p>
        {isNoAdvantageDetected && <p>Conclusion : aucun avantage détectable par rapport au hasard.</p>}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={histogramData}>
            <CartesianGrid />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#7c6fd1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div data-testid="window-comparison">
        <h3>Comparaison par fenêtre temporelle</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fenêtre</th>
              <th>Numéros moy.</th>
            </tr>
          </thead>
          <tbody>
            {experiment.windowComparisons.map((comparison) => (
              <tr key={String(comparison.window)}>
                <td>{windowLabel(comparison.window)}</td>
                <td>{comparison.metrics.meanMatchedNumbers.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div data-testid="generated-grids">
        <h3>Grilles générées (période de test)</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Grille proposée</th>
              <th>Étoiles</th>
              <th>Numéros trouvés</th>
            </tr>
          </thead>
          <tbody>
            {experiment.results.generatedGrids.map((generated) => (
              <tr key={generated.date} data-testid="generated-grid-row">
                <td>{generated.date}</td>
                <td>{generated.grid.numbers.join(' · ')}</td>
                <td>{generated.grid.stars.join(' · ')}</td>
                <td>{generated.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={() => onExport(experiment)} data-testid="export-button">
        Télécharger les résultats (JSON)
      </button>
    </section>
  );
};

export default ExperimentResults;
