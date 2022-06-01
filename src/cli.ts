import runner from "./runner";

(async function main() {
  const res = await runner();
  console.log(res);
})();
