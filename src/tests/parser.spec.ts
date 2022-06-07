import parse, { cleanNode } from "../parser";

const debugDifference = (node) => cleanNode(node);

describe("parser", () => {
  it("should handle additions", () => {
    const differences = parse(
      `
        const bar = 5;
        const foo = 6;
        `,
      `
        const bar = 5;
        `
    );
    expect(differences.map1.length).toEqual(1);
    expect(differences.map1[0]).toEqual(
      expect.objectContaining({
        type: "VariableDeclaration",
        kind: "const",
      })
    );
    expect(differences.map2.length).toEqual(0);
  });

  it("should handle removals", () => {
    const differences = parse(
      `
        const bar = 5;
        `,
      `
        const bar = 5;
        const foo = 6;
        `
    );
    expect(differences.map1.length).toEqual(0);
    expect(differences.map2.length).toEqual(1);
    expect(differences.map2[0]).toEqual(
      expect.objectContaining({
        type: "VariableDeclaration",
        kind: "const",
      })
    );
  });

  it("should handle simple logic differences", () => {
    const differences = parse(
      `
        const bar = 5;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences.map1.length).toEqual(1);
    expect(differences.map1[0]).toEqual(
      expect.objectContaining({
        type: "VariableDeclaration",
        kind: "const",
      })
    );
    expect(differences.map2.length).toEqual(1);
    expect(differences.map2[0]).toEqual(
      expect.objectContaining({
        type: "VariableDeclaration",
        kind: "const",
      })
    );
  });

  it("should ignore type annotations and declarations", () => {
    const differences = parse(
      `
        type Bar = number;
        const bar: Bar = 7;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences.map1).toEqual([]);
    expect(differences.map2).toEqual([]);
  });

  it("should ignore type annotations and declarations unless the value has changed", () => {
    const differences = parse(
      `
        type Bar = number;
        const bar: Bar = 5;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences.map1).toEqual([
      expect.objectContaining({
        type: "VariableDeclaration",
        kind: "const",
      }),
    ]);
    expect(differences.map2).toEqual([
      expect.objectContaining({
        type: "VariableDeclaration",
        kind: "const",
      }),
    ]);
  });

  it("should ignore exported types", () => {
    const differences = parse(
      `
        export type Bar = number;
        const bar: Bar = 7;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences.map1).toEqual([]);
    expect(differences.map2).toEqual([]);
  });

  it("should not ignore exported declarations", () => {
    const differences = parse(
      `
        export const bar: Bar = 7;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences.map1).toEqual([
      expect.objectContaining({
        type: "ExportNamedDeclaration",
      }),
    ]);
    // Simple declaration AST node now missing
    expect(differences.map2).toEqual([
      expect.objectContaining({
        type: "VariableDeclaration",
      }),
    ]);
  });

  it.only("should not ignore exported functions", () => {
    const differences = parse(
      `
        export default function() {
          return 5
        };
        `,
      `
        export default function () {
          return 6
        };
        `
    );
    expect(differences.map1).toEqual([
      expect.objectContaining({
        type: "ReturnStatement",
      }),
    ]);
    // Simple declaration AST node now missing
    expect(differences.map2).toEqual([
      expect.objectContaining({
        type: "ReturnStatement",
      }),
    ]);
  });
});
