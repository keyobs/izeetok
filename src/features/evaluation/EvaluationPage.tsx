import { useEvaluationPage } from './useEvaluationPage.ts';
import EvaluationScreen from './EvaluationScreen.tsx';

const EvaluationPage = () => {
  const viewModel = useEvaluationPage();
  return <EvaluationScreen {...viewModel} />;
};

export default EvaluationPage;
