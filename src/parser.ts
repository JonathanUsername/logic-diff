import getParser from "jscodeshift/src/getParser";
import jscodeshift from "jscodeshift/src/core";
import { Collection, ASTPath, Node } from "jscodeshift";
import get from "lodash.get";
import { eachField } from "ast-types";
import crypto from "crypto";
import * as utils from "./utils";

export type NodeWithId = AstNode & {
  id: string;
};
export type AstNode = ASTPath<Node>["node"];
export type NodeMap = Map<string, NodeWithId>;

const removeTokensField = <T extends AstNode>(o: T): T => {
  if (!o) {
    return o;
  }

  delete o["tokens"];

  Object.entries(o).forEach(([k, v]) => {
    if (typeof v === "object") {
      const out = removeTokensField(v);
      o[k] = out;
    }
  });
  return o;
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
  return utils.omitNested(obj, [
    // Location etc.
    "start",
    "end",
    "extra",
    "loc",
    "regex",
    "source",
    // Comments
    "trailingComments",
    "leadingComments",
    "comments",
    // Type annotations
    "typeAnnotation",
    "declaration", // Not sure about this
  ]);
};

const getIdFromObj = (o: {}) => {
  const objStr = JSON.stringify(o);
  return crypto.createHash("md5").update(objStr).digest("hex");
};

export const cleanNode = (node: AstNode) => {
  let cleanNode = {};
  eachField(node, (name, value) => {
    let cleanValue;
    if (typeof value === "object") {
      // Copy object
      cleanValue = removeTokensField({ ...value });
    } else {
      cleanValue = removeTokensField(value);
    }

    cleanNode[name] = cleanValue;
  });
  return removeUncomparedFields(cleanNode);
};

const getNodeWithId = (node: Node): NodeWithId => {
  const clonedNode = removeTokensField({ ...node });
  const clonedLoc = get(node, "loc");
  const cleanedNode = cleanNode(clonedNode);

  const id = getIdFromObj(cleanedNode);

  return {
    loc: clonedLoc,
    ...node,
    id,
  };
};

function parse(src: string, comparisonSrc: string): utils.DifferenceResult {
  const j = jscodeshift.withParser(getParser("ts"));

  const ast = j(src);
  const comparisonAst = j(comparisonSrc);

  const makeMapOfNodes = (collection: Collection<any>): NodeMap => {
    const map = new Map();
    collection
      .nodes()[0]
      .program.body.filter((node) => {
        if (!node) {
          return false;
        }
        console.log(node);
        // Ignore Typescript related stuff
        if (node.type.startsWith("TS") || node.exportKind === "type") {
          return false;
        }
        return true;
      })
      .forEach((p) => {
        const node = getNodeWithId(p);
        map.set(node.id, node);
      });
    return map;
  };

  const astIdsMap = makeMapOfNodes(ast);
  const comaprisonAstIdsMap = makeMapOfNodes(comparisonAst);

  const differences = utils.findDifferenceInMaps(
    astIdsMap,
    comaprisonAstIdsMap
  );

  return differences;
}

export default parse;
