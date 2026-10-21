import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useDraws } from '../../hooks/useDraws.ts';
import {
  DEFAULT_RULES_STATE,
  RULE_KINDS,
  buildRulesFromState,
  clampRulesStateToText,
  parseClampedInt,
} from './strategyFormRules.ts';
import type { RulesState } from './strategyFormRules.ts';
import type { Experiment } from './runExperiment.ts';
import { runExperiment } from './runExperiment.ts';
import type { TemporalWindow } from '../../analysis/scoring/TemporalWindow.ts';
import type { Strategy } from '../../analysis/strategy/Strategy.ts';

const DEFAULT_MONTE_CARLO_SAMPLES = '200';
export const SEED_MIN = 0;
export const SEED_MAX = 999999;
export const PERCENT_MIN = 0;
export const PERCENT_MAX = 100;
export const MONTE_CARLO_MIN = 1;
export const MONTE_CARLO_MAX = 2000;

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
  isDrawsError: boolean;
  onRetryDraws: () => void;
  strategyName: string;
  setStrategyName: Dispatch<SetStateAction<string>>;
  seed: string;
  onSeedChange: (value: string) => void;
  rulesState: RulesState;
  updateRule: (kind: (typeof RULE_KINDS)[number], patch: Partial<RulesState[(typeof RULE_KINDS)[number]]>) => void;
  trainPercent: string;
  onTrainPercentChange: (value: string) => void;
  validationPercent: string;
  onValidationPercentChange: (value: string) => void;
  testPercent: number;
  selectedWindows: TemporalWindow[];
  toggleWindow: (window: TemporalWindow) => void;
  monteCarloSampleCount: string;
  onMonteCarloSampleCountChange: (value: string) => void;
  experiments: Experiment[];
  selectedExperiment: Experiment | null;
  onSelectExperiment: (experimentId: string) => void;
  onRunExperiment: () => void;
  onExportExperiment: (experiment: Experiment) => void;
}

export const useLaboratoryPage = (): LaboratoryPageViewModel => {
  const [strategyName, setStrategyName] = useState('Ma stratégie');
  const [seed, setSeed] = useState('42');
  const [rulesState, setRulesState] = useState<RulesState>(DEFAULT_RULES_STATE);
  const [trainPercent, setTrainPercent] = useState('70');
  const [validationPercent, setValidationPercent] = useState('15');
  const [selectedWindows, setSelectedWindows] = useState<TemporalWindow[]>(['all']);
  const [monteCarloSampleCount, setMonteCarloSampleCount] = useState(DEFAULT_MONTE_CARLO_SAMPLES);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);

  const { draws, isLoading: isHistoryLoading, isError: isDrawsError, refetch: onRetryDraws } = useDraws();
  const testPercent =
    100 - parseClampedInt(trainPercent, PERCENT_MIN, PERCENT_MAX) - parseClampedInt(validationPercent, PERCENT_MIN, PERCENT_MAX);

  // Every field below mirrors the raw typed text verbatim, with no
  // parsing or bounds-checking - see the comment on RuleConfigState for
  // why. Bounds are enforced once, in onRunExperiment, right before these
  // numbers reach the math.
  const updateRule = (kind: (typeof RULE_KINDS)[number], patch: Partial<RulesState[typeof kind]>) => {
    setRulesState((previous) => ({ ...previous, [kind]: { ...previous[kind], ...patch } }));
  };

  const toggleWindow = (window: TemporalWindow) => {
    setSelectedWindows((previous) =>
      previous.includes(window) ? previous.filter((w) => w !== window) : [...previous, window],
    );
  };

  const onRunExperiment = () => {
    const clampedSeed = parseClampedInt(seed, SEED_MIN, SEED_MAX);
    const clampedTrainPercent = parseClampedInt(trainPercent, PERCENT_MIN, PERCENT_MAX);
    const clampedValidationPercent = parseClampedInt(validationPercent, PERCENT_MIN, PERCENT_MAX);
    const clampedMonteCarloSampleCount = parseClampedInt(monteCarloSampleCount, MONTE_CARLO_MIN, MONTE_CARLO_MAX);
    const clampedRulesState = clampRulesStateToText(rulesState);

    // Reflect back into state so the form displays exactly what was run,
    // rather than whatever out-of-bounds text was still sitting in a field.
    setSeed(String(clampedSeed));
    setTrainPercent(String(clampedTrainPercent));
    setValidationPercent(String(clampedValidationPercent));
    setMonteCarloSampleCount(String(clampedMonteCarloSampleCount));
    setRulesState(clampedRulesState);

    const strategy: Strategy = {
      id: crypto.randomUUID(),
      name: strategyName,
      rules: buildRulesFromState(clampedRulesState),
      seed: clampedSeed,
    };

    const experiment = runExperiment({
      strategy,
      draws,
      trainRatio: clampedTrainPercent / 100,
      validationRatio: clampedValidationPercent / 100,
      windows: selectedWindows,
      monteCarloSampleCount: clampedMonteCarloSampleCount,
    });

    setExperiments((previous) => [experiment, ...previous]);
    setSelectedExperimentId(experiment.id);
  };

  const selectedExperiment = experiments.find((experiment) => experiment.id === selectedExperimentId) ?? null;

  return {
    isHistoryLoading,
    isDrawsError,
    onRetryDraws,
    strategyName,
    setStrategyName,
    seed,
    onSeedChange: setSeed,
    rulesState,
    updateRule,
    trainPercent,
    onTrainPercentChange: setTrainPercent,
    validationPercent,
    onValidationPercentChange: setValidationPercent,
    testPercent,
    selectedWindows,
    toggleWindow,
    monteCarloSampleCount,
    onMonteCarloSampleCountChange: setMonteCarloSampleCount,
    experiments,
    selectedExperiment,
    onSelectExperiment: setSelectedExperimentId,
    onRunExperiment,
    onExportExperiment: downloadExperiment,
  };
};
