import forEach from "lodash.foreach";
import unset from "lodash.unset";
import { NodeWithId, NodeMap } from "./parser";

export const omitNested = <T extends Object>(obj: T, paths: string[]): T => {
  forEach(paths, function (omitProperty) {
    unset(obj, omitProperty);
  });
  return obj;
};

export const setDifference = (a: Set<string>, b: Set<string>) => {
  let a_minus_b = new Set([...a].filter((x) => !b.has(x)));
  let b_minus_a = new Set([...b].filter((x) => !a.has(x)));
  return new Set([...a_minus_b, ...b_minus_a]);
};

const difference = (a: NodeMap, b: NodeMap) => {
  return new Set([...a.keys()].filter((x) => !b.has(x)));
};

export type DifferenceResult = {
  map1: NodeWithId[];
  map2: NodeWithId[];
};

export const findDifferenceInMaps = (
  map1: NodeMap,
  map2: NodeMap
): DifferenceResult => {
  const map1ExtraKeys = difference(map1, map2);
  const map2ExtraKeys = difference(map2, map1);

  const result = {
    map1: [],
    map2: [],
  };
  map1ExtraKeys.forEach((key) => {
    const value = map1.get(key);
    if (value.type !== "Program") {
      result.map1.push(value);
    }
  });
  map2ExtraKeys.forEach((key) => {
    const value = map2.get(key);
    if (value.type !== "Program") {
      result.map2.push(value);
    }
  });

  return result;
};

const uniqStr = (arr: string[]) => [...new Set([...arr])];

export const mapLocs = (fileName: string, arr: NodeWithId[]) =>
  uniqStr(
    arr
      .filter((i) => !!i.loc && !(Object.keys(i.loc).length === 0))
      .map((i) => `${fileName}:${i.loc.start.line}:${i.loc.start.column}`)
  );
