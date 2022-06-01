import { run as jscodeshift } from "jscodeshift/src/Runner";

(async function main() {
  const transformPath = "./transform.ts";
  const paths = ["../spec/foo.js", "../spec/foo.ts"];
  const res = await jscodeshift(transformPath, paths, options);
  console.log(res);
})();
