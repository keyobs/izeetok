import { z } from 'zod';

export interface Grid {
  numbers: [number, number, number, number, number];
  stars: [number, number];
}

const distinctSortedTuple = (min: number, max: number, count: number) =>
  z
    .array(z.number().int().min(min).max(max))
    .length(count)
    .refine((values) => new Set(values).size === count, {
      message: `Expected ${count} distinct values between ${min} and ${max}`,
    })
    .transform((values) => [...values].sort((a, b) => a - b));

export const gridSchema = z
  .object({
    numbers: distinctSortedTuple(1, 50, 5),
    stars: distinctSortedTuple(1, 12, 2),
  })
  .transform(
    ({ numbers, stars }): Grid => ({
      numbers: numbers as Grid['numbers'],
      stars: stars as Grid['stars'],
    }),
  );

export const parseGrid = (input: unknown): Grid => gridSchema.parse(input);
