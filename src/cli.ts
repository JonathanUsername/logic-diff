#!/usr/bin/env node
import runner from "./runner";
import yargs, { string } from "yargs";

export type UserOptions = {
  paths: string[];
  compareCommit?: string;
  ext?: string;
  srcFilePath?: string;
  verbose: number;
  silent: boolean;
  diffContext: number;
};

let argv = yargs
  .usage("Usage: ts-safe-diff <commitSha> --paths src/foo/*.ts src/bar.ts")
  .command(
    ["$0"],
    "Diff all files matching a path with the same files at a given commit SHA",
    (yargs) => {
      yargs.positional("commitSha", {
        type: "string",
        describe: "The commit to diff all files against",
        require: true,
      });
      yargs.option("paths", {
        type: "array",
        describe:
          "A series of globs to start the runner with, e.g. src/**/*.ts",
        require: true,
        alias: "p",
      });
      yargs.option("ext", {
        type: "string",
        describe: `If the file you want to compare against had a different extension, use this to specify it, e.g. 'js'`,
        alias: "x",
        require: false,
      });
      yargs.option("verbose", {
        type: "number",
        describe: `Passed to jscodeshift`,
        alias: "v",
        require: false,
        default: 0,
      });
      yargs.option("silent", {
        type: "boolean",
        describe: `Passed to jscodeshift`,
        alias: "s",
        require: false,
        default: false,
      });
      yargs.option("diffContext", {
        type: "number",
        describe: `Number of lines for context of the diff, like -C in grep`,
        alias: "C",
        require: false,
        default: 3,
      });
      yargs.demandCommand(1);
    }
  )
  .help()
  .parseSync();

const {
  _: [commitSha],
  paths,
  ext,
  srcFilePath,
  silent,
  verbose,
  diffContext,
} = argv;

const args = {
  compareCommit: commitSha,
  paths,
  ext,
  srcFilePath,
  silent,
  verbose,
  diffContext,
} as UserOptions;

async function main() {
  const { changedFiles } = await runner(args);
  if (changedFiles.length) {
    process.exit(1);
  }
}

main();
