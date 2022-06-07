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
} = argv;

const args = {
  paths,
  ext,
  compareCommit: commitSha,
  srcFilePath,
  silent,
  verbose,
} as UserOptions;

// Debug values:
// compareCommit: "9a1adc39117b7ead41a1d38173b22cdc224faefa",
// srcFilePath: join(__dirname, "..", "/spec/foo2.ts"),

async function main() {
  const res = await runner(args);
}

main();
