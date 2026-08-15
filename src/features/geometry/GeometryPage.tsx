import { useGeometryPage } from './useGeometryPage.ts';
import GeometryScreen from './GeometryScreen.tsx';

const GeometryPage = () => {
  const viewModel = useGeometryPage();
  return <GeometryScreen {...viewModel} />;
};

export default GeometryPage;
