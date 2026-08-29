import { useQuery } from '@tanstack/react-query';
import type { Draw } from '../analysis/draw/Draw.ts';
import { drawRepository } from '../api/drawRepositoryInstance.ts';

const EMPTY_DRAWS: Draw[] = [];

export interface UseDrawsResult {
  draws: Draw[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const useDraws = (): UseDrawsResult => {
  const query = useQuery({ queryKey: ['draws', 'all'], queryFn: () => drawRepository.getAll() });

  return {
    draws: query.data ?? EMPTY_DRAWS,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
};
