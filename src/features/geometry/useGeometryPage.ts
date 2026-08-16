import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { drawRepository } from '../../api/drawRepositoryInstance.ts';
import { useEvaluatedGrid } from '../../providers/EvaluatedGridContext.tsx';
import type { GridVariation } from '../../analysis/generateVariations.ts';
import { generateVariations } from '../../analysis/generateVariations.ts';
import type { Draw } from '../../analysis/draw/Draw.ts';
import type { Grid } from '../../analysis/grid/Grid.ts';
import { extractFeatures } from '../../analysis/features/FeatureExtractor.ts';
import { buildGeometryDescriptor } from '../../analysis/geometry/GeometryDescriptor.ts';
import type { NearestNeighbor } from '../../analysis/geometry/nearestNeighbors.ts';
import { findNearestNeighbors } from '../../analysis/geometry/nearestNeighbors.ts';

const DECADE_LABELS = ['1-10', '11-20', '21-30', '31-40', '41-50'];
const NEIGHBOR_COUNT = 10;
const EMPTY_DRAWS: Draw[] = [];

export type ReferenceSource = 'latest' | 'evaluated' | 'custom';

export const SOURCE_LABELS: Record<ReferenceSource, string> = {
  latest: 'Dernier tirage',
  evaluated: 'Grille évaluée',
  custom: 'Saisie libre',
};

export const SOURCE_HINTS: Record<ReferenceSource, string> = {
  latest: 'Le dernier tirage officiel enregistré, pris comme exemple.',
  evaluated: "La grille que vous avez évaluée sur /evaluation.",
  custom: "Entrez n'importe quelle grille pour la situer dans l'historique.",
};

interface SumAmplitudePoint {
  sum: number;
  range: number;
}

interface SumStdDevPoint {
  sum: number;
  stdDev: number;
}

interface DecadeHistogramBar {
  decade: string;
  count: number;
  hasReference: boolean;
}

export interface GeometryPageViewModel {
  isLoading: boolean;
  hasEntries: boolean;
  source: ReferenceSource;
  onSourceChange: (source: ReferenceSource) => void;
  isEvaluatedSourceAvailable: boolean;
  onCustomGridSubmit: (grid: Grid) => void;
  referenceGrid: Grid | null;
  latestEntryDate: string | undefined;
  sumAmplitudeData: SumAmplitudePoint[];
  referenceSumAmplitude: SumAmplitudePoint[];
  sumStdDevData: SumStdDevPoint[];
  referenceSumStdDev: SumStdDevPoint[];
  decadeHistogram: DecadeHistogramBar[];
  referenceVariation: GridVariation | null;
  neighbors: NearestNeighbor<Draw>[];
  maxNeighborDistance: number;
}

export const useGeometryPage = (): GeometryPageViewModel => {
  const drawsQuery = useQuery({
    queryKey: ['draws', 'all'],
    queryFn: () => drawRepository.getAll(),
  });
  const draws = drawsQuery.data ?? EMPTY_DRAWS;

  const { evaluatedGrid } = useEvaluatedGrid();

  const [source, setSource] = useState<ReferenceSource>(evaluatedGrid ? 'evaluated' : 'latest');
  const [customGrid, setCustomGrid] = useState<Grid | null>(null);

  const entries = useMemo(
    () =>
      [...draws]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((draw) => ({
          draw,
          descriptor: buildGeometryDescriptor({ numbers: draw.numbers, stars: draw.stars }),
          stdDev: extractFeatures({ numbers: draw.numbers, stars: draw.stars }).values.stdDev,
        })),
    [draws],
  );

  const latestEntry = entries[0];
  const latestGrid: Grid | null = latestEntry ? { numbers: latestEntry.draw.numbers, stars: latestEntry.draw.stars } : null;

  const referenceGrid: Grid | null =
    source === 'latest' ? latestGrid : source === 'evaluated' ? evaluatedGrid : customGrid;

  const referenceDescriptor = useMemo(
    () => (referenceGrid ? buildGeometryDescriptor(referenceGrid) : null),
    [referenceGrid],
  );
  const referenceStdDev = useMemo(
    () => (referenceGrid ? extractFeatures(referenceGrid).values.stdDev : null),
    [referenceGrid],
  );

  const sumAmplitudeData = useMemo(
    () => entries.map((entry) => ({ sum: entry.descriptor.sum, range: entry.descriptor.range })),
    [entries],
  );
  const sumStdDevData = useMemo(
    () => entries.map((entry) => ({ sum: entry.descriptor.sum, stdDev: entry.stdDev })),
    [entries],
  );

  const decadeHistogram = useMemo(
    () =>
      DECADE_LABELS.map((label, index) => ({
        decade: label,
        count: entries.reduce((acc, entry) => acc + entry.descriptor.decadeBuckets[index], 0),
        hasReference: Boolean(referenceDescriptor && referenceDescriptor.decadeBuckets[index] > 0),
      })),
    [entries, referenceDescriptor],
  );

  const referenceSumAmplitude = useMemo(
    () => (referenceDescriptor ? [{ sum: referenceDescriptor.sum, range: referenceDescriptor.range }] : []),
    [referenceDescriptor],
  );
  const referenceSumStdDev = useMemo(
    () =>
      referenceDescriptor && referenceStdDev != null
        ? [{ sum: referenceDescriptor.sum, stdDev: referenceStdDev }]
        : [],
    [referenceDescriptor, referenceStdDev],
  );

  // Excludes the reference draw from its own neighbor candidates only when it
  // actually comes from the historical list ('latest') - an evaluated/custom
  // grid isn't part of `entries`, so nothing needs excluding for it.
  const neighborCandidates = source === 'latest' ? entries.slice(1) : entries;
  const neighbors = useMemo(
    () =>
      referenceDescriptor
        ? findNearestNeighbors(
            referenceDescriptor,
            neighborCandidates.map((entry) => ({ item: entry.draw, descriptor: entry.descriptor })),
            NEIGHBOR_COUNT,
          )
        : [],
    [referenceDescriptor, neighborCandidates],
  );
  const maxNeighborDistance = useMemo(
    () => (neighbors.length > 0 ? Math.max(...neighbors.map((n) => n.distance)) : 0),
    [neighbors],
  );

  const referenceVariation = useMemo(() => {
    if (!referenceGrid || draws.length === 0) return null;
    const [variation] = generateVariations(referenceGrid, draws);
    return variation ?? null;
  }, [referenceGrid, draws]);

  return {
    isLoading: drawsQuery.isLoading,
    hasEntries: entries.length > 0,
    source,
    onSourceChange: setSource,
    isEvaluatedSourceAvailable: Boolean(evaluatedGrid),
    onCustomGridSubmit: setCustomGrid,
    referenceGrid,
    latestEntryDate: latestEntry?.draw.date,
    sumAmplitudeData,
    referenceSumAmplitude,
    sumStdDevData,
    referenceSumStdDev,
    decadeHistogram,
    referenceVariation,
    neighbors,
    maxNeighborDistance,
  };
};
