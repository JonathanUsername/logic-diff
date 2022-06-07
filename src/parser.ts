import getParser from "jscodeshift/src/getParser";
import jscodeshift from "jscodeshift/src/core";
import {
  Collection,
  ASTPath,
  Node,
  JSCodeshift,
  ExportDeclaration,
} from "jscodeshift";
import * as Diff from "diff";
import prettier from "prettier";

export type NodeWithId = AstNode & {
  id: string;
};
export type AstNode = ASTPath<Node>["node"];
export type NodeMap = Map<string, NodeWithId>;

interface TSExport extends ExportDeclaration {
  exportKind: string;
}

interface TSAnnotatedNode extends Node {
  typeAnnotation?: Node;
}

const isTSAnnotatedNode = (node: any): node is TSAnnotatedNode =>
  "typeAnnotation" in node;

const isTSExport = (node: any): node is TSExport =>
  "exportKind" in node && node.exportKind === "type";

function getCleanedSource(collection: Collection<any>, j: JSCodeshift): string {
  // First traverse and remove some tricky references
  collection.find(j.Node).forEach((nodePath) => {
    // First delete type annotations, which are a non-standard AST property
    if (isTSAnnotatedNode(nodePath.node)) {
      delete nodePath.node.typeAnnotation;
    }

    // Then delete comments
    delete nodePath.node.comments;
  });

  // Now prune all TS-related nodes
  collection
    .find(j.Node)
    .filter((node) => {
      const { value } = node;

      const isExportedType =
        isTSExport(value) && value.exportKind && value.exportKind === "type";

      const isTSNode = value.type.startsWith("TS");

      return isExportedType || isTSNode;
    })
    .forEach((nodePath) => {
      try {
        nodePath.prune();
      } catch (_) {
        // failing to repair node relationships can *probably* be ignored
      }
    });
  const src = collection.toSource();

  // We don't care how it's formatted, as long as it's formatted the same
  // Though we do give up any possibility to get a halfway useful line number,
  // but that's already out the window anyway since type declarationss can
  // push everything around
  return prettier.format(src, { parser: "babel-ts" });
}

export enum DiffType {
  Same = "same",
  Removed = "removed",
  Added = "added",
}

export interface DiffResult {
  type: DiffType;
  raw: string;
}

function parseDiff(changes: Diff.Change[]): DiffResult[] {
  return changes.map((change) => {
    const isWhitespaceChange = change.value.trim() === "";

    if (change.added && !isWhitespaceChange) {
      return {
        type: DiffType.Added,
        raw: change.value,
      };
    } else if (change.removed && !isWhitespaceChange) {
      return {
        type: DiffType.Removed,
        raw: change.value,
      };
    } else {
      return {
        type: DiffType.Same,
        raw: change.value,
      };
    }
  });
}

function parse(src: string, comparisonSrc: string): DiffResult[] {
  const j = jscodeshift.withParser(getParser("ts"));

  const ast = j(src);
  const comparisonAst = j(comparisonSrc);

  const cleanedSrc = getCleanedSource(ast, j);
  const cleanedComparisonSrc = getCleanedSource(comparisonAst, j);

  // Comparison comes first here
  const changes = Diff.diffLines(cleanedComparisonSrc, cleanedSrc, {
    ignoreCase: false,
    ignoreWhitespace: true,
  });
  const diffResult = parseDiff(changes);

  return diffResult;
}

export default parse;
