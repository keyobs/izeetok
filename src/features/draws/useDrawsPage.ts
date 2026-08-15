import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { drawRepository } from '../../api/drawRepositoryInstance.ts';
import type { Draw } from '../../analysis/draw/Draw.ts';
import { buildGeometryDescriptor } from '../../analysis/geometry/GeometryDescriptor.ts';
import { computeGeometryDistance } from '../../analysis/geometry/GeometryDistance.ts';

const DEFAULT_LIMIT = 50;

export interface DrawRow {
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

export interface DrawsPageViewModel {
  isLoading: boolean;
  hasData: boolean;
  rows: DrawRow[];
  showAll: boolean;
  toggleShowAll: () => void;
}

export const useDrawsPage = (): DrawsPageViewModel => {
  const [showAll, setShowAll] = useState(false);

  const allDrawsQuery = useQuery({
    queryKey: ['draws', 'all'],
    queryFn: () => drawRepository.getAll(),
  });

  const rows = useMemo(() => {
    const allRows = buildRowsMostRecentFirst(allDrawsQuery.data ?? []);
    return showAll ? allRows : allRows.slice(0, DEFAULT_LIMIT);
  }, [allDrawsQuery.data, showAll]);

  return {
    isLoading: allDrawsQuery.isLoading,
    hasData: Boolean(allDrawsQuery.data),
    rows,
    showAll,
    toggleShowAll: () => setShowAll((previous) => !previous),
  };
};
