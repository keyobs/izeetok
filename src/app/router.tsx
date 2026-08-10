import { Navigate, createBrowserRouter } from 'react-router';
import AppLayout from './AppLayout.tsx';
import EvaluationPage from '../pages/evaluation/EvaluationPage.tsx';
import DrawsPage from '../pages/draws/DrawsPage.tsx';
import GeometryPage from '../pages/geometry/GeometryPage.tsx';
import SpikePage from '../pages/spike/SpikePage.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/evaluation" replace /> },
      { path: 'evaluation', element: <EvaluationPage /> },
      { path: 'draws', element: <DrawsPage /> },
      { path: 'geometry', element: <GeometryPage /> },
      { path: 'spike', element: <SpikePage /> },
    ],
  },
]);
