import type { GeometryDescriptor } from './GeometryDescriptor.ts';
import { computeGeometryDistance } from './GeometryDistance.ts';

export interface GeometryCandidate<T> {
  item: T;
  descriptor: GeometryDescriptor;
}

export interface NearestNeighbor<T> {
  item: T;
  descriptor: GeometryDescriptor;
  distance: number;
}

export const findNearestNeighbors = <T>(
  target: GeometryDescriptor,
  candidates: GeometryCandidate<T>[],
  k: number,
): NearestNeighbor<T>[] =>
  candidates
    .map(({ item, descriptor }) => ({
      item,
      descriptor,
      distance: computeGeometryDistance(target, descriptor).total,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
