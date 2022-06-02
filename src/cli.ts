import runner from "./runner";
import { parse } from "ts-command-line-args";

export interface GitOptions {
  compareCommit: string;
  wasJs?: boolean;
  path: string;
}

export interface FileOptions {
  srcFilePath: string;
  wasJs?: boolean;
  path: string;
}

export type UserOptions = GitOptions | FileOptions;

const args = parse<UserOptions>(
  {
    // @ts-ignore
    path: String,
    wasJs: { type: Boolean, optional: true },
    compareCommit: { type: String, optional: true },
    srcFilePath: { type: String, optional: true },
  },
  {
    headerContentSections: [
      {
        header: `Check for logic changes in files. Ignoring typescript types.`,
      },
    ],
  }
);

// Debug values:
// compareCommit: "9a1adc39117b7ead41a1d38173b22cdc224faefa",
// srcFilePath: join(__dirname, "..", "/spec/foo2.ts"),

async function main() {
  const res = await runner(args);
  console.log(res);
}

main();
