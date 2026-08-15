import type { DrawsPageViewModel } from './useDrawsPage.ts';
import styles from './DrawsPage.module.scss';

const DrawsScreen = ({ isLoading, hasData, rows, showAll, toggleShowAll }: DrawsPageViewModel) => (
  <div className={styles.page}>
    <h1>Tirages</h1>

    {isLoading && <p>Chargement...</p>}

    {hasData && (
      <>
        <p className={styles.toolbar}>
          {showAll ? `Historique complet (${rows.length} tirages)` : `${rows.length} derniers tirages`}
          <button type="button" onClick={toggleShowAll} data-testid="toggle-history">
            {showAll ? 'Voir les derniers tirages' : "Voir tout l'historique"}
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
                  <td>{row.draw.numbers.join(' · ')}</td>
                  <td>{row.draw.stars.join(' · ')}</td>
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
