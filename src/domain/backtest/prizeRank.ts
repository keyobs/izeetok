export const countMatches = (a: readonly number[], b: readonly number[]): number => {
  const setB = new Set(b);
  return a.filter((n) => setB.has(n)).length;
};

/** The 13 official EuroMillions prize tiers, by (matched numbers, matched stars). */
const RANK_TABLE: { matchedNumbers: number; matchedStars: number; rank: number }[] = [
  { matchedNumbers: 5, matchedStars: 2, rank: 1 },
  { matchedNumbers: 5, matchedStars: 1, rank: 2 },
  { matchedNumbers: 5, matchedStars: 0, rank: 3 },
  { matchedNumbers: 4, matchedStars: 2, rank: 4 },
  { matchedNumbers: 4, matchedStars: 1, rank: 5 },
  { matchedNumbers: 3, matchedStars: 2, rank: 6 },
  { matchedNumbers: 4, matchedStars: 0, rank: 7 },
  { matchedNumbers: 2, matchedStars: 2, rank: 8 },
  { matchedNumbers: 3, matchedStars: 1, rank: 9 },
  { matchedNumbers: 3, matchedStars: 0, rank: 10 },
  { matchedNumbers: 1, matchedStars: 2, rank: 11 },
  { matchedNumbers: 2, matchedStars: 1, rank: 12 },
  { matchedNumbers: 2, matchedStars: 0, rank: 13 },
];

export const prizeRank = (matchedNumbers: number, matchedStars: number): number | null => {
  const entry = RANK_TABLE.find(
    (candidate) => candidate.matchedNumbers === matchedNumbers && candidate.matchedStars === matchedStars,
  );
  return entry ? entry.rank : null;
};
