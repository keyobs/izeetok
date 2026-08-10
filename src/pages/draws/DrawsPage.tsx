import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { drawRepository } from '../../application/drawRepository.ts';
import type { Draw } from '../../domain/draw/Draw.ts';
import { buildGeometryDescriptor } from '../../domain/geometry/GeometryDescriptor.ts';
import { computeGeometryDistance } from '../../domain/geometry/GeometryDistance.ts';
import styles from './DrawsPage.module.scss';

const DEFAULT_LIMIT = 50;

interface DrawRow {
  draw: Draw;
  sum: number;
  range: number;
  oddCount: number;
  evenCount: number;
  signature: string;
  distanceToPrevious: number | null;
}

const buildRowsMostRecentFirst = (draws: Draw[]): DrawRow[] => {
  const sortedAscending = [...draws].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const rows: DrawRow[] = [];
  let previousDescriptor: ReturnType<typeof buildGeometryDescriptor> | null = null;

  for (const draw of sortedAscending) {
    const descriptor = buildGeometryDescriptor({ numbers: draw.numbers, stars: draw.stars });
    rows.push({
      draw,
      sum: descriptor.sum,
      range: descriptor.range,
      oddCount: descriptor.oddCount,
      evenCount: descriptor.evenCount,
      signature: descriptor.decadeBuckets.join('-'),
      distanceToPrevious: previousDescriptor
        ? computeGeometryDistance(descriptor, previousDescriptor).total
        : null,
    });
    previousDescriptor = descriptor;
  }

  return rows.reverse();
};

const DrawsPage = () => {
  const [showAll, setShowAll] = useState(false);

  const allDrawsQuery = useQuery({
    queryKey: ['draws', 'all'],
    queryFn: () => drawRepository.getAll(),
  });

  const rows = useMemo(() => {
    const allRows = buildRowsMostRecentFirst(allDrawsQuery.data ?? []);
    return showAll ? allRows : allRows.slice(0, DEFAULT_LIMIT);
  }, [allDrawsQuery.data, showAll]);

  return (
    <div className={styles.page}>
      <h1>Tirages</h1>

      {allDrawsQuery.isLoading && <p>Chargement...</p>}

      {allDrawsQuery.data && (
        <>
          <p>
            {showAll ? `Historique complet (${rows.length} tirages)` : `${rows.length} derniers tirages`}
            {' — '}
            <button type="button" onClick={() => setShowAll((previous) => !previous)} data-testid="toggle-history">
              {showAll ? 'Voir les derniers tirages' : "Voir tout l'historique"}
            </button>
          </p>
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
        </>
      )}
    </div>
  );
};

export default DrawsPage;
