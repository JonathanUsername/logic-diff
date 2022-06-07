import { API } from "jscodeshift";
import { DiffType, DiffResult } from "./parser";
import { Options } from "./runner";
import * as utils from "./utils";
import chalk from "chalk";

export default function (
  differences: DiffResult[],
  originalPath: string,
  gitRelativePath: string,
  api: API,
  options: Options
): string {
  let report = ``;

  const numDifferences = differences.filter(utils.differs).length;
  if (numDifferences === 0) {
    return report;
  }

  const { diffContext } = options;

  api.stats(originalPath, numDifferences);

  report += chalk.red(
    `Found ${numDifferences} difference(s) in logic of ${originalPath}.\n`
  );
  report += chalk.grey(
    `Context is given so you can find where the logic change might be, since line numbers are not supported.\n`
  );

  differences.forEach((diff, idx) => {
    if (utils.differs(diff)) {
      report += `\n====== ${gitRelativePath} =====\n`;
      const includeHeader = idx > 0 && !!differences[idx - 1];
      if (includeHeader) {
        const contextHeaderDiff = differences[idx - 1];
        const contextHeaderLines = contextHeaderDiff.raw.split("\n");
        const range = [
          Math.max(0, contextHeaderLines.length - diffContext),
          contextHeaderLines.length,
        ];
        report += chalk.grey(
          `${contextHeaderLines.slice(...range).join("\n")}`
        );
      }

      switch (diff.type) {
        case DiffType.Added:
          report += chalk.green(diff.raw);
          break;
        case DiffType.Removed:
          report += chalk.red(diff.raw);
          break;
      }

      const includeFooter = idx < differences.length && !!differences[idx + 1];
      if (includeFooter) {
        const contextFooterDiff = differences[idx + 1];
        const contextFooterLines = contextFooterDiff.raw.split("\n");
        const range = [0, Math.min(contextFooterLines.length, diffContext)];
        report += chalk.grey(
          `${contextFooterLines.slice(...range).join("\n")}`
        );
      }
    }
  });

  return report;
}
