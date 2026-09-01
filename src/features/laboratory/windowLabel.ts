import type { TemporalWindow } from '../../analysis/scoring/TemporalWindow.ts';

export const windowLabel = (window: TemporalWindow): string => (window === 'all' ? 'Tout' : `${window} an(s)`);
