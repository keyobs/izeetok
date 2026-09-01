import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import EvaluatedGridProvider from '../providers/EvaluatedGridProvider.tsx';

export const renderWithProviders = (element: ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <EvaluatedGridProvider>{element}</EvaluatedGridProvider>
    </QueryClientProvider>,
  );
};
