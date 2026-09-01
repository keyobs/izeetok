import DataLoadError from '../../components/dataLoadError/DataLoadError.tsx';
import type { DrawsPageViewModel } from './useDrawsPage.ts';
import styles from './DrawsPage.module.scss';

const highlightedCell = (values: readonly number[], highlightValues: readonly number[] | undefined) => (
  <div className={styles.badgeRow}>
    {values.map((value) => (
      <span
        key={value}
        className={highlightValues?.includes(value) ? `${styles.badge} ${styles.badgeMatched}` : styles.badge}
      >
        {value}
      </span>
    ))}
  </div>
);

const DrawsScreen = ({
  isLoading,
  isDrawsError,
  onRetryDraws,
  hasData,
  rows,
  showAll,
  toggleShowAll,
  isHighlightOn,
  onToggleHighlight,
  isHighlightAvailable,
  highlightGrid,
}: DrawsPageViewModel) => (
  <div className={styles.page}>
    <h1>Tirages</h1>

    {isLoading && <p>Chargement...</p>}
    {isDrawsError && <DataLoadError onRetry={onRetryDraws} />}

    {hasData && (
      <>
        <p className={styles.toolbar}>
          {showAll ? `Historique complet (${rows.length} tirages)` : `${rows.length} derniers tirages`}
          <button type="button" onClick={toggleShowAll} data-testid="toggle-history">
            {showAll ? 'Voir les derniers tirages' : "Voir tout l'historique"}
          </button>
          <button
            type="button"
            className={styles.highlightToggle}
            aria-pressed={isHighlightOn}
            onClick={onToggleHighlight}
            disabled={!isHighlightAvailable}
            title={isHighlightAvailable ? undefined : `Définir une grille pour voir l'historique`}
            data-testid="highlight-toggle"
          >
            {isHighlightOn ? 'Masquer mes numéros' : 'Identifier mes numéros'}
          </button>
        </p>
        <div className={styles.tableWrapper}>
          <table className={styles.table} data-testid="draws-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Numéros</th>
                <th>Étoiles</th>
                <th>Somme</th>
                <th>Amplitude</th>
                <th>Parité</th>
                <th>Signature</th>
                <th>Distance au précédent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.draw.id} data-testid="draw-row">
                  <td>{row.draw.date}</td>
                  <td>{highlightedCell(row.draw.numbers, highlightGrid?.numbers)}</td>
                  <td>{highlightedCell(row.draw.stars, highlightGrid?.stars)}</td>
                  <td>{row.sum}</td>
                  <td>{row.range}</td>
                  <td>
                    {row.oddCount} impair / {row.evenCount} pair
                  </td>
                  <td>{row.signature}</td>
                  <td>{row.distanceToPrevious === null ? '—' : row.distanceToPrevious.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
  </div>
);

export default DrawsScreen;
