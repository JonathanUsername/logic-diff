import Runner from "jscodeshift/src/Runner";
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
  const transformPath = glob.sync(join(__dirname, "transform") + "*")[0];
  const getPath = (globStr) =>
    glob.sync(globStr).map((relativePath) => resolve(relativePath));
  const paths = userOptions.paths.map(getPath).flat();
  const options: Options = {
    ...userOptions,
    dry: true,
    parser: "ts",
  };
  const resp = await Runner.run(transformPath, paths, options);
  reporter(resp);
}
