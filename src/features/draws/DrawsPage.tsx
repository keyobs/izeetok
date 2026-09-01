import { useDrawsPage } from './useDrawsPage.ts';
import DrawsScreen from './DrawsScreen.tsx';

const DrawsPage = () => {
  const viewModel = useDrawsPage();
  return <DrawsScreen {...viewModel} />;
};

export default DrawsPage;
