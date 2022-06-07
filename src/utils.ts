import _ from "lodash";
import { ASTPath, Node } from "jscodeshift";
import { eachField } from "ast-types";
import crypto from "crypto";

export type NodeWithId = AstNode & {
  id: string;
};
export type AstNode = ASTPath<Node>["node"];
export type NodeMap = Map<string, NodeWithId>;

const unCircularLoc = <T extends AstNode>(o: T): T => {
  if (!o) {
    return o;
  }

  delete o["tokens"];

  Object.entries(o).forEach(([k, v]) => {
    if (typeof v === "object") {
      const out = unCircularLoc(v);
      o[k] = out;
    }
  });
  return o;
};

const omitNested = <T extends Object>(obj: T, paths: string[]): T => {
  _.forEach(paths, function (omitProperty) {
    _.unset(obj, omitProperty);
  });
  return obj;
};

const removeUncomparedFields = <T extends Object>(obj: T): T => {
  if (!obj) {
    return obj;
  }
  Object.entries(obj).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    if (Array.isArray(value)) {
      obj[key] = value.map(removeUncomparedFields);
    }
    if (typeof value === "object") {
      obj[key] = removeUncomparedFields(value);
    }
  });
  return omitNested(obj, [
    // Location etc.
    "start",
    "end",
    "extra",
    "loc",
    "regex",
    // Comments
    "trailingComments",
    "leadingComments",
    "comments",
    // Type annotations
    "typeAnnotation",
    "declaration",
  ]);
};

const getIdFromObj = (o: {}) => {
  const objStr = JSON.stringify(o);
  return crypto.createHash("md5").update(objStr).digest("hex");
};

const cleanNode = (node: AstNode) => {
  let cleanNode = {};
  eachField(node, (name, value) => {
    let cleanValue;
    if (typeof value === "object") {
      // Copy object
      cleanValue = unCircularLoc({ ...value });
    } else {
      cleanValue = unCircularLoc(value);
    }

    cleanNode[name] = cleanValue;
  });
  return removeUncomparedFields(cleanNode);
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

export const getNodeWithId = (node: Node): NodeWithId => {
  const clonedNode = { ...node };
  const clonedLoc = _.get(node, "loc");
  const cleanedNode = cleanNode(clonedNode);

  const id = getIdFromObj(cleanedNode);

  return {
    loc: clonedLoc,
    ...node,
    id,
  };
};
