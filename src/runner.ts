import { run as jscodeshift } from "jscodeshift/src/Runner";
import path, { join, relative, resolve } from "path";
import { UserOptions } from "./cli";
import glob from "glob";

export type Options = UserOptions & {
  dry: true;
  parser: "ts";
  verbose: number;
};

export default async function runner(userOptions: UserOptions) {
  const transformPath = join(__dirname, "transform.ts");
  const paths = glob
    .sync(userOptions.path)
    .map((relativePath) => resolve(relativePath));
  console.log(paths);
  const options: Options = {
    ...userOptions,
    dry: true,
    verbose: 2,
    parser: "ts",
  };
  return jscodeshift(transformPath, paths, options);
}
