import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { queryClient } from './app/queryClient.ts';
import { router } from './app/router.tsx';
import EvaluatedGridProvider from './providers/EvaluatedGridProvider.tsx';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <EvaluatedGridProvider>
        <RouterProvider router={router} />
      </EvaluatedGridProvider>
    </QueryClientProvider>
  );
};

export default App;
