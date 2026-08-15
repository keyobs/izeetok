import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useQuery } from '@tanstack/react-query';
import { drawRepository } from '../../api/drawRepositoryInstance.ts';
import type { Experiment } from './runExperiment.ts';
import { runExperiment } from './runExperiment.ts';
import type { Draw } from '../../analysis/draw/Draw.ts';
import type { TemporalWindow } from '../../analysis/scoring/TemporalWindow.ts';
import type { Strategy } from '../../analysis/strategy/Strategy.ts';
import { DEFAULT_RULES_STATE, RULE_KINDS, buildRulesFromState } from './strategyFormRules.ts';
import type { RulesState } from './strategyFormRules.ts';

const EMPTY_DRAWS: Draw[] = [];
const DEFAULT_MONTE_CARLO_SAMPLES = 200;

const downloadExperiment = (experiment: Experiment) => {
  const blob = new Blob([JSON.stringify(experiment, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `experiment-${experiment.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export interface LaboratoryPageViewModel {
  isHistoryLoading: boolean;
  strategyName: string;
  setStrategyName: Dispatch<SetStateAction<string>>;
  seed: number;
  setSeed: Dispatch<SetStateAction<number>>;
  rulesState: RulesState;
  updateRule: (kind: (typeof RULE_KINDS)[number], patch: Partial<RulesState[(typeof RULE_KINDS)[number]]>) => void;
  trainPercent: number;
  setTrainPercent: Dispatch<SetStateAction<number>>;
  validationPercent: number;
  setValidationPercent: Dispatch<SetStateAction<number>>;
  testPercent: number;
  selectedWindows: TemporalWindow[];
  toggleWindow: (window: TemporalWindow) => void;
  monteCarloSampleCount: number;
  setMonteCarloSampleCount: Dispatch<SetStateAction<number>>;
  experiments: Experiment[];
  selectedExperiment: Experiment | null;
  onSelectExperiment: (experimentId: string) => void;
  onRunExperiment: () => void;
  onExportExperiment: (experiment: Experiment) => void;
}

export const useLaboratoryPage = (): LaboratoryPageViewModel => {
  const [strategyName, setStrategyName] = useState('Ma stratégie');
  const [seed, setSeed] = useState(42);
  const [rulesState, setRulesState] = useState<RulesState>(DEFAULT_RULES_STATE);
  const [trainPercent, setTrainPercent] = useState(70);
  const [validationPercent, setValidationPercent] = useState(15);
  const [selectedWindows, setSelectedWindows] = useState<TemporalWindow[]>(['all']);
  const [monteCarloSampleCount, setMonteCarloSampleCount] = useState(DEFAULT_MONTE_CARLO_SAMPLES);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);

  const historyQuery = useQuery({ queryKey: ['draws', 'all'], queryFn: () => drawRepository.getAll() });
  const draws = historyQuery.data ?? EMPTY_DRAWS;
  const testPercent = 100 - trainPercent - validationPercent;

  const updateRule = (kind: (typeof RULE_KINDS)[number], patch: Partial<RulesState[typeof kind]>) => {
    setRulesState((previous) => ({ ...previous, [kind]: { ...previous[kind], ...patch } }));
  };

  const toggleWindow = (window: TemporalWindow) => {
    setSelectedWindows((previous) =>
      previous.includes(window) ? previous.filter((w) => w !== window) : [...previous, window],
    );
  };

  const onRunExperiment = () => {
    const strategy: Strategy = {
      id: crypto.randomUUID(),
      name: strategyName,
      rules: buildRulesFromState(rulesState),
      seed,
    };

    const experiment = runExperiment({
      strategy,
      draws,
      trainRatio: trainPercent / 100,
      validationRatio: validationPercent / 100,
      windows: selectedWindows,
      monteCarloSampleCount,
    });

    setExperiments((previous) => [experiment, ...previous]);
    setSelectedExperimentId(experiment.id);
  };

  const selectedExperiment = experiments.find((experiment) => experiment.id === selectedExperimentId) ?? null;

  return {
    isHistoryLoading: historyQuery.isLoading,
    strategyName,
    setStrategyName,
    seed,
    setSeed,
    rulesState,
    updateRule,
    trainPercent,
    setTrainPercent,
    validationPercent,
    setValidationPercent,
    testPercent,
    selectedWindows,
    toggleWindow,
    monteCarloSampleCount,
    setMonteCarloSampleCount,
    experiments,
    selectedExperiment,
    onSelectExperiment: setSelectedExperimentId,
    onRunExperiment,
    onExportExperiment: downloadExperiment,
  };
};
