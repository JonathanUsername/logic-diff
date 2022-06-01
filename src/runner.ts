import { run as jscodeshift } from "jscodeshift/src/Runner";
import { join } from "path";

export default async function runner() {
  const transformPath = join(__dirname, "transform.ts");
  const paths = [
    join(__dirname, "..", "spec/foo.js"),
    join(__dirname, "..", "/spec/foo.ts"),
  ];
  const options = { dry: true };
  return jscodeshift(transformPath, paths, options);
}
