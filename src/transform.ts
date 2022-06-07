import _ from "lodash";
import { extname, relative } from "path";
import { FileInfo, API, Collection } from "jscodeshift";
import simpleGit from "simple-git";
import { readFileSync } from "fs";
import * as utils from "./utils";
import { Options } from "./runner";
import { fileReport } from "./reporter";

const stripExtension = (path: string) =>
  path.replace(RegExp(`${extname(path)}$`), "");

export default async (fileInfo: FileInfo, api: API, options: Options) => {
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

    if (options.ext) {
      gitRelativePath = stripExtension(gitRelativePath) + "." + options.ext;
    }

    comparisonPath = `${options.compareCommit}:${gitRelativePath}`;

    try {
      comparisonSrc = await simpleGit().catFile(["--textconv", comparisonPath]);
    } catch (e) {
      throw new Error(
        `No source file to compare with for ${originalPath} - ${e}`
      );
    }
  }

  if (!comparisonSrc || !comparisonPath) {
    throw new Error(`Could not find source for comparison for ${originalPath}`);
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

  fileReport(differences, originalPath, comparisonPath, api, options);
};
