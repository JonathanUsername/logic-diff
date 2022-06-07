import { extname, relative } from "path";
import { FileInfo, API } from "jscodeshift";
import simpleGit from "simple-git";
import { readFileSync } from "fs";
import { Options } from "./runner";
import { fileReport } from "./reporter";
import parse from "./parser";

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

  const differences = parse(fileInfo.source, comparisonSrc);

  fileReport(differences, originalPath, comparisonPath, api, options);
};
