import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { drawRepository } from '../../api/drawRepositoryInstance.ts';
import type { DiscoveryConfig, DiscoveryResult } from './discoverStructure.ts';
import { discoverStructure } from './discoverStructure.ts';
import type { Draw } from '../../analysis/draw/Draw.ts';

const EMPTY_DRAWS: Draw[] = [];

const DISCOVERY_CONFIG: DiscoveryConfig = {
  kCandidates: [2, 3, 4, 5, 6, 7, 8],
  neighborCount: 10,
  bootstrapIterations: 20,
  seed: 42,
};

export interface ScatterPoint {
  x: number;
  y: number;
  drawId: string;
}

export interface DiscoveryPageViewModel {
  isLoading: boolean;
  discovery: DiscoveryResult | null;
  scatterSeriesByCluster: [string, ScatterPoint[]][];
}

export const useDiscoveryPage = (): DiscoveryPageViewModel => {
  const drawsQuery = useQuery({ queryKey: ['draws', 'all'], queryFn: () => drawRepository.getAll() });
  const draws = drawsQuery.data ?? EMPTY_DRAWS;

  const discovery = useMemo(() => (draws.length > 0 ? discoverStructure(draws, DISCOVERY_CONFIG) : null), [draws]);

  const scatterSeriesByCluster = useMemo((): [string, ScatterPoint[]][] => {
    if (!discovery) return [];
    const byCluster = new Map<string, ScatterPoint[]>();
    for (const embedding of discovery.embeddings) {
      const clusterId = embedding.clusterId ?? 'none';
      const points = byCluster.get(clusterId) ?? [];
      points.push({ x: embedding.coordinates.x, y: embedding.coordinates.y, drawId: embedding.drawId });
      byCluster.set(clusterId, points);
    }
    return [...byCluster.entries()].sort(([a], [b]) => Number(a) - Number(b));
  }, [discovery]);

  return {
    isLoading: drawsQuery.isLoading,
    discovery,
    scatterSeriesByCluster,
  };
};
