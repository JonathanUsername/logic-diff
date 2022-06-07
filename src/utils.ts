import { DiffResult, DiffType } from "./parser";

export const differs = (diff: DiffResult) =>
  [DiffType.Added, DiffType.Removed].includes(diff.type);

export const sum = (arr) => arr.reduce((sum, i) => sum + i, 0);
