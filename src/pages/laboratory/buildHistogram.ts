export interface HistogramBin {
  label: string;
  count: number;
}

export const buildHistogram = (values: number[], binCount: number): HistogramBin[] => {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binSize = range / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    label: (min + i * binSize).toFixed(2),
    count: 0,
  }));

  for (const value of values) {
    const index = Math.min(Math.floor((value - min) / binSize), binCount - 1);
    bins[index].count += 1;
  }

  return bins;
};
