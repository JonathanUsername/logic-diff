import _ from "lodash";
import { ASTPath, Node, SourceLocation } from "jscodeshift";
import { eachField } from "ast-types";
import crypto from "crypto";

type AstNode = ASTPath<Node>["node"];
interface CleanLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

const isLocation = (o: any): o is SourceLocation => {
  if (!o) {
    return false;
  }
  const objectKeys = Object.keys(o);
  const locationKeys = ["start", "end", "lines"];
  return locationKeys.every((key) => objectKeys.includes(key));
};

const unCircularLoc = <T extends AstNode>(
  o: T,
  loc?: SourceLocation
): [T, CleanLocation] => {
  let foundLoc = loc;
  if (!o) {
    return [o, foundLoc];
  }

  const location = o.loc;
  if (location) {
    const { start, end } = location;
    delete o["loc"];
    foundLoc = { start, end };
  }

  Object.entries(o).forEach(([k, v]) => {
    if (typeof v === "object") {
      const [out, loc] = unCircularLoc(v, foundLoc);
      o[k] = out;
      if (!foundLoc) {
        foundLoc = loc;
      }
    }
  });
  return [o, foundLoc];
};

const omitNested = <T extends Object>(obj: T, paths: string[]): T => {
  _.forEach(paths, function (omitProperty) {
    _.unset(obj, omitProperty);
  });
  return obj;
};

const removeIrrelevantFields = <T extends Object>(obj: T): T => {
  if (!obj) {
    return obj;
  }
  Object.entries(obj).forEach(([key, value]) => {
    if (key === "loc") {
      return;
    }
    if (!value) {
      return;
    }
    if (Array.isArray(value)) {
      obj[key] = value.map(removeIrrelevantFields);
    }
    if (typeof value === "object") {
      obj[key] = removeIrrelevantFields(value);
    }
  });
  return omitNested(obj, [
    // Location etc.
    "start",
    "end",
    "extra",
    // "loc",
    "regex",
    // Comments
    "trailingComments",
    "leadingComments",
    "comments",
  ]);
};

const getIdFromObj = (o: {}) => {
  const objStr = JSON.stringify(o);
  return crypto.createHash("md5").update(objStr).digest("hex");
};

export type NodeWithId = AstNode & {
  id: string;
  debugStr: string;
  parentId: string;
};

const cleanNode = (node: AstNode) => {
  let cleanNode = {};
  eachField(node, (name, value) => {
    let cleanValue, loc;
    if (typeof value === "object") {
      // Copy object
      [cleanValue, loc] = unCircularLoc({ ...value });
    } else {
      [cleanValue, loc] = unCircularLoc(value);
    }

    cleanNode[name] = cleanValue;
    if (!node.loc) {
      // @ts-ignore
      cleanNode.loc = loc;
    }
  });
  return removeIrrelevantFields(cleanNode);
};

export const getNodeWithId = (nodePath: ASTPath<Node>): NodeWithId => {
  if (nodePath.node.type === "Program") {
    console.log(nodePath.node.body[0]);
  }
  const originalNode = { ...nodePath.node };
  const node = cleanNode(nodePath.node);

  const debugStr = JSON.stringify(node, null, 2);
  const id = getIdFromObj(node);

  const parent = nodePath._computeParent();
  const parentNode = cleanNode(parent.node);
  const parentId = getIdFromObj(parentNode);

  return {
    ...originalNode,
    debugStr,
    id,
    parentId,
  };
};

export const setDifference = (a: Set<string>, b: Set<string>) => {
  let a_minus_b = new Set([...a].filter((x) => !b.has(x)));
  let b_minus_a = new Set([...b].filter((x) => !a.has(x)));
  return new Set([...a_minus_b, ...b_minus_a]);
};
