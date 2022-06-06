import runner from "./runner";
import yargs from "yargs";

export type UserOptions = {
  path: string;
  compareCommit?: string;
  ext?: string;
  srcFilePath?: string;
};

let argv = yargs(process.argv.slice(2))
  .usage("Usage: <path> [commitSha] --srcFilePath [srcFilePath]")
  .alias("f", "srcFilepath")
  .describe("f", "Use a file to diff against instead of a commit")
  .command("$0", "Diff all files, given a path, recursively.", (yargs) => {
    yargs.positional("path", {
      describe: "A glob to start the runner with, e.g. src/**/*.ts",
      require: true,
    });
    yargs.positional("commitSha", {
      describe: "The commit to diff all files against",
      require: false,
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
    });
    yargs.demandCommand(1);
  })
  .help()
  .parseSync();

const {
  _: [path, commitSha],
  ext,
  srcFilePath,
} = argv;

const args = {
  path,
  ext,
  compareCommit: commitSha,
  srcFilePath,
} as UserOptions;

// Debug values:
// compareCommit: "9a1adc39117b7ead41a1d38173b22cdc224faefa",
// srcFilePath: join(__dirname, "..", "/spec/foo2.ts"),

async function main() {
  const res = await runner(args);
  console.log(res);
}

main();
