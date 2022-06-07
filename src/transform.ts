import { extname, relative } from "path";
import { FileInfo, API } from "jscodeshift";
import simpleGit from "simple-git";
import { Options } from "./runner";
import parse from "./parser";
import report from "./report";

const stripExtension = (path: string) =>
  path.replace(RegExp(`${extname(path)}$`), "");

export default async (fileInfo: FileInfo, api: API, options: Options) => {
  let { path } = fileInfo;
  const originalPath = path;

  let comparisonSrc = "";

  const gitRoot = await simpleGit().revparse(["--show-toplevel"]);
  const gitRelativePath = relative(gitRoot, path);

  let gitRelativePathWithExtension = gitRelativePath;
  if (options.ext) {
    gitRelativePathWithExtension =
      stripExtension(gitRelativePath) + "." + options.ext;
  }

  const comparisonPath = `${options.compareCommit}:${gitRelativePathWithExtension}`;

  try {
    comparisonSrc = await simpleGit().catFile(["--textconv", comparisonPath]);
  } catch (e) {
    throw new Error(
      `No source file to compare with for ${originalPath} - ${e}`
    );
  }

  if (!comparisonSrc || !comparisonPath) {
    throw new Error(`Could not find source for comparison for ${originalPath}`);
  }

  const differences = parse(fileInfo.source, comparisonSrc);

  // Because we're using print: true, it will log the returned string
  return report(differences, originalPath, gitRelativePath, api, options);
};
