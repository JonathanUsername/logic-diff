import { run as jscodeshift } from "jscodeshift/src/Runner";
import { join } from "path";

export default async function runner() {
  const transformPath = join(__dirname, "transform.ts");
  const paths = [join(__dirname, "..", "/spec/foo.ts")];
  const options = {
    dry: true,
    ignoreExtension: false,
    wasJs: true,
    verbose: 2,
    parser: "ts",
    compareCommit: "9a1adc39117b7ead41a1d38173b22cdc224faefa",
    debugSrc: join(__dirname, "..", "/spec/foo2.ts"),
  };
  return jscodeshift(transformPath, paths, options);
}
