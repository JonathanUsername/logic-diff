import _ from "lodash";
import { extname, relative } from "path";
import { FileInfo, API, Options, ASTPath, Node, Collection } from "jscodeshift";
import simpleGit from "simple-git";
import { readFileSync } from "fs";
import { getNodeWithId, NodeWithId, setDifference } from "./utils";

const stripExtension = (path: string) =>
  path.replace(RegExp(`${extname(path)}$`), "");

export default async (fileInfo: FileInfo, api: API, options: Options) => {
  let { path } = fileInfo;
  const originalPath = path;

  if (options.ignoreExtension) {
    path = stripExtension(path);
  }

  let comparisonSrc = "";
  let comparisonPath = "";

  // Rename
  if (options.debugSrc) {
    comparisonPath = options.debugSrc;
    comparisonSrc = readFileSync(options.debugSrc).toString();
  } else {
    const gitRoot = await simpleGit().revparse(["--show-toplevel"]);
    let gitRelativePath = relative(gitRoot, path);

    if (options.wasJs) {
      gitRelativePath = stripExtension(gitRelativePath) + ".js";
    }

    comparisonSrc = await simpleGit().catFile([
      "--textconv",
      `${options.compareCommit}:${gitRelativePath}`,
    ]);
  }

  const j = api.jscodeshift;
  const ast = j(fileInfo.source);
  const comparisonAst = j(comparisonSrc);

  type NodeMap = Map<string, NodeWithId>;

  const makeMapOfNodes = (collection: Collection<any>): NodeMap => {
    const map = new Map();
    collection.find(j.Node).forEach((p) => {
      const node = getNodeWithId(p);

      // const key = `${node.id}:${node.parentId}`;
      const key = `${node.id}`;
      map.set(key, node);
    });
    return map;
  };

  const astIdsMap = makeMapOfNodes(ast);
  const comaprisonAstIdsMap = makeMapOfNodes(comparisonAst);

  const difference = (a: NodeMap, b: NodeMap) => {
    return new Set([...a.keys()].filter((x) => !b.has(x)));
  };

  type DifferenceResult = {
    map1: NodeWithId[];
    map2: NodeWithId[];
  };

  const findDifferenceInMaps = (
    map1: NodeMap,
    map2: NodeMap
  ): DifferenceResult => {
    const map1ExtraKeys = difference(map1, map2);
    const map2ExtraKeys = difference(map2, map1);

    const result = {
      map1: [],
      map2: [],
    };
    map1ExtraKeys.forEach((key) => {
      const value = map1.get(key);
      if (value.type !== "Program") {
        result.map1.push(value);
      }
    });
    map2ExtraKeys.forEach((key) => {
      const value = map2.get(key);
      if (value.type !== "Program") {
        result.map2.push(value);
      }
    });

    return result;
  };

  const uniqStr = (arr: string[]) => [...new Set([...arr])];

  const mapLocs = (fileName: string, arr: NodeWithId[]) =>
    uniqStr(
      arr
        .filter((i) => !!i.loc && !(Object.keys(i.loc).length === 0))
        .map((i) => `\n${fileName}:${i.loc.start.line}:${i.loc.start.column}`)
    );

  const differences = findDifferenceInMaps(astIdsMap, comaprisonAstIdsMap);
  const file1Differences = differences.map1;
  const file2Differences = differences.map2;
  if (!file1Differences.length) {
    api.report("No change in file 1");
  } else {
    // console.log(file1Differences);
    api.report(
      `File 1 differences: ${mapLocs(originalPath, file1Differences)}`
    );
  }

  if (!file2Differences.length) {
    api.report("No change in file 2");
  } else {
    // console.log(file2Differences);
    api.report(
      `File 2 differences: ${mapLocs(comparisonPath, file2Differences)}`
    );
  }

  api.stats(path, 1);
};
