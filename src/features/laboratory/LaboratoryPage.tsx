import { useLaboratoryPage } from './useLaboratoryPage.ts';
import LaboratoryScreen from './LaboratoryScreen.tsx';

const LaboratoryPage = () => {
  const viewModel = useLaboratoryPage();
  return <LaboratoryScreen {...viewModel} />;
};

export default LaboratoryPage;
