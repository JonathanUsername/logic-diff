import { API } from "jscodeshift";
import { DiffType, DiffResult } from "./parser";
import { Options } from "./runner";
import * as utils from "./utils";

export default function (
  differences: DiffResult[],
  originalPath: string,
  api: API,
  options: Options
): string {
  const isDiffering = differences.filter(utils.differs).length > 0;

  let report = ``;

  if (!isDiffering) {
    return report;
  }

  const { diffContext } = options;
  report += `Found differences in logic of ${originalPath}:\n`;

  differences.forEach((diff, idx) => {
    if (utils.differs(diff)) {
      api.stats(originalPath);
      report += diff.raw;
    }
  });

  return report;
}
