import { Navigate, createBrowserRouter } from 'react-router';
import AppLayout from './AppLayout.tsx';
import EvaluationPage from '../features/evaluation/EvaluationPage.tsx';
import DrawsPage from '../features/draws/DrawsPage.tsx';
import GeometryPage from '../features/geometry/GeometryPage.tsx';
import LaboratoryPage from '../features/laboratory/LaboratoryPage.tsx';
import DiscoveryPage from '../features/discovery/DiscoveryPage.tsx';
import SpikePage from '../sandbox/spike/SpikePage.tsx';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/evaluation" replace /> },
        { path: 'evaluation', element: <EvaluationPage /> },
        { path: 'draws', element: <DrawsPage /> },
        { path: 'geometry', element: <GeometryPage /> },
        { path: 'laboratory', element: <LaboratoryPage /> },
        { path: 'discovery', element: <DiscoveryPage /> },
        { path: 'spike', element: <SpikePage /> },
      ],
    },
  ],
  { basename: import.meta.env.VITE_BASE_PATH || '/' },
);
