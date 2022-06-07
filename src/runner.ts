import { run as jscodeshift } from "jscodeshift/src/Runner";
import { join, resolve } from "path";
import { UserOptions } from "./cli";
import glob from "glob";
import reporter from "./reporter";

export type Options = UserOptions & {
  dry: true;
  parser: "ts";
  verbose: number;
  silent: boolean;
};

export default async function runner(userOptions: UserOptions) {
  const transformPath = join(__dirname, "transform.ts");
  const getPath = (globStr) =>
    glob.sync(globStr).map((relativePath) => resolve(relativePath));
  const paths = userOptions.paths.map(getPath).flat();
  const options: Options = {
    ...userOptions,
    dry: true,
    parser: "ts",
  };
  const resp = await jscodeshift(transformPath, paths, options);
  reporter(resp);
}
