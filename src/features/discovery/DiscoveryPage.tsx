import { useDiscoveryPage } from './useDiscoveryPage.ts';
import DiscoveryScreen from './DiscoveryScreen.tsx';

const DiscoveryPage = () => {
  const viewModel = useDiscoveryPage();
  return <DiscoveryScreen {...viewModel} />;
};

export default DiscoveryPage;
