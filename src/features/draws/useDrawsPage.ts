import { useMemo, useState } from 'react';
import { useDraws } from '../../hooks/useDraws.ts';
import { useEvaluatedGrid } from '../../providers/EvaluatedGridContext.tsx';
import type { Draw } from '../../analysis/draw/Draw.ts';
import type { Grid } from '../../analysis/grid/Grid.ts';
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
  isDrawsError: boolean;
  onRetryDraws: () => void;
  hasData: boolean;
  rows: DrawRow[];
  showAll: boolean;
  toggleShowAll: () => void;
  isHighlightOn: boolean;
  onToggleHighlight: () => void;
  isHighlightAvailable: boolean;
  highlightGrid: Grid | null;
}

export const useDrawsPage = (): DrawsPageViewModel => {
  const [showAll, setShowAll] = useState(false);
  const [isHighlightOn, setIsHighlightOn] = useState(false);

  const { draws, isLoading, isError: isDrawsError, refetch: onRetryDraws } = useDraws();
  const { evaluatedGrid } = useEvaluatedGrid();

  const rows = useMemo(() => {
    const allRows = buildRowsMostRecentFirst(draws);
    return showAll ? allRows : allRows.slice(0, DEFAULT_LIMIT);
  }, [draws, showAll]);

  return {
    isLoading,
    isDrawsError,
    onRetryDraws,
    hasData: draws.length > 0,
    rows,
    showAll,
    toggleShowAll: () => setShowAll((previous) => !previous),
    isHighlightOn,
    onToggleHighlight: () => setIsHighlightOn((previous) => !previous),
    isHighlightAvailable: Boolean(evaluatedGrid),
    highlightGrid: isHighlightOn ? evaluatedGrid : null,
  };
};
