import { API } from "jscodeshift";
import { Options } from "./runner";
import * as utils from "./utils";

const sum = (arr) => arr.reduce((sum, i) => sum + i, 0);

export default function (resp) {
  const { stats, error, ok, nochange, skip } = resp;
  const totalFiles = sum([error, ok, nochange, skip]);
  const locs = Object.keys(stats);
  const totalDiffs = locs.length;
  if (totalDiffs === 0) {
    console.log(`No logical changes found out of ${totalFiles} files checked`);
  } else {
    const locLines = locs.join("\n");
    const report = `
Found ${totalDiffs} difference(s) out of ${totalFiles} files at these locations:
${locLines}

Use --verbose to get more info
    `;
    console.log(report);
  }
  if (error) {
    console.log(`There were also ${error} error(s).`);
  }
}

export function fileReport(
  differences: utils.DifferenceResult,
  originalPath: string,
  comparisonPath: string,
  api: API,
  options: Options
) {
  const file1Differences = differences.map1;
  const file2Differences = differences.map2;

  const log = options.verbose > 0 ? api.report : (...args) => {};

  if (file1Differences.length === 0 && file2Differences.length === 0) {
    log("No changes to logic");
  } else {
    const file1Locs = utils.mapLocs(originalPath, file1Differences);
    const file2Locs = utils.mapLocs(comparisonPath, file2Differences);
    const diffs = ["\n", file1Locs.join("\n"), "\n", file2Locs.join("\n")].join(
      ""
    );
    log(`Found AST differences: ${diffs}\n`);
    [...file1Locs, ...file2Locs].forEach((loc) => {
      api.stats(loc, 1);
    });

    // Debugging
    if (diffs.trim().length === 0) {
      console.log(file1Differences, file2Differences);
    }
  }
}
