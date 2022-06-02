import _ from "lodash";
import { extname, relative } from "path";
import { FileInfo, API, ASTPath, Node, Collection } from "jscodeshift";
import simpleGit from "simple-git";
import { readFileSync } from "fs";
import * as utils from "./utils";
import { GitOptions, FileOptions } from "./cli";

const stripExtension = (path: string) =>
  path.replace(RegExp(`${extname(path)}$`), "");

export default async (
  fileInfo: FileInfo,
  api: API,
  options: GitOptions & FileOptions
) => {
  let { path } = fileInfo;
  const originalPath = path;

  let comparisonSrc = "";
  let comparisonPath = "";

  if (options.srcFilePath) {
    comparisonPath = options.srcFilePath;
    comparisonSrc = readFileSync(options.srcFilePath).toString();
  } else {
    const gitRoot = await simpleGit().revparse(["--show-toplevel"]);
    let gitRelativePath = relative(gitRoot, path);

    if (options.wasJs) {
      gitRelativePath = stripExtension(gitRelativePath) + ".js";
    }

    comparisonPath = `${options.compareCommit}:${gitRelativePath}`;

    comparisonSrc = await simpleGit().catFile(["--textconv", comparisonPath]);
  }

  if (!comparisonSrc || !comparisonPath) {
    throw new Error("Could not find source for comparison");
  }

  const j = api.jscodeshift;
  const ast = j(fileInfo.source);
  const comparisonAst = j(comparisonSrc);

  const makeMapOfNodes = (collection: Collection<any>): utils.NodeMap => {
    const map = new Map();
    collection
      .nodes()[0]
      .program.body.filter((node) => {
        if (!node) {
          return false;
        }
        // Ignore Typescript related stuff
        if (node.type.startsWith("TS") || node.exportKind === "type") {
          return false;
        }
        return true;
      })
      .forEach((p) => {
        const node = utils.getNodeWithId(p);
        map.set(node.id, node);
      });
    return map;
  };

  const astIdsMap = makeMapOfNodes(ast);
  const comaprisonAstIdsMap = makeMapOfNodes(comparisonAst);

  const differences = utils.findDifferenceInMaps(
    astIdsMap,
    comaprisonAstIdsMap
  );
  const file1Differences = differences.map1;
  const file2Differences = differences.map2;

  if (file1Differences.length === 0 && file2Differences.length === 0) {
    api.report("No changes to logic");
  } else {
    const file1Locs = utils.mapLocs(originalPath, file1Differences);
    const file2Locs = utils.mapLocs(comparisonPath, file2Differences);
    const diffs = ["\n", file1Locs.join("\n"), "\n", file2Locs.join("\n")].join(
      ""
    );
    api.report(`Found AST differences: ${diffs}\n`);
    [...file1Locs, ...file2Locs].forEach((loc) => {
      api.stats(loc, 1);
    });

    // Debugging
    if (diffs.trim().length === 0) {
      console.log(file1Differences, file2Differences);
    }
  }
};
