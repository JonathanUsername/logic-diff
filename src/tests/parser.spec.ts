import parse, { DiffType } from "../parser";

const getParsedDifferences = (newSrc: string, oldSrc: string) => {
  const differences = parse(newSrc, oldSrc);

  return (
    differences
      // Simplify the test, just look at the actual differences
      .filter(({ type }) => [DiffType.Added, DiffType.Removed].includes(type))
      // Trim the whitespace for readability
      .map((i) => ({ ...i, raw: i.raw.trim() }))
  );
};

describe("parser", () => {
  it("should handle additions", () => {
    const differences = getParsedDifferences(
      `
        const bar = 5;
        const foo = 6;
        `,
      `
        const bar = 5;
        `
    );
    expect(differences).toEqual([
      { type: DiffType.Added, raw: "const foo = 6;" },
    ]);
  });

  it("should handle removals", () => {
    const differences = getParsedDifferences(
      `
        const bar = 5;
        `,
      `
        const bar = 5;
        const foo = 6;
        `
    );
    expect(differences).toEqual([
      { type: DiffType.Removed, raw: "const foo = 6;" },
    ]);
  });

  it("should handle value differences", () => {
    const differences = getParsedDifferences(
      `
        const bar = 5;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences).toEqual([
      { type: DiffType.Removed, raw: "const bar = 7;" },
      { type: DiffType.Added, raw: "const bar = 5;" },
    ]);
  });

  it("should disregard whitespace", () => {
    const differences = getParsedDifferences(
      `




           const   bar  =   5;



        `,
      `
        const bar = 5;
        `
    );
    expect(differences).toEqual([]);
  });

  it("should ignore type annotations and declarations", () => {
    const differences = getParsedDifferences(
      `
        type Bar = number;
        const bar: Bar = 7;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences).toEqual([]);
  });

  it("should ignore type annotations and declarations unless the value has changed", () => {
    const differences = getParsedDifferences(
      `
        type Bar = number;
        const bar: Bar = 5;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences).toEqual([
      { type: DiffType.Removed, raw: "const bar = 7;" },
      { type: DiffType.Added, raw: "const bar = 5;" },
    ]);
  });

  it("should ignore exported types", () => {
    const differences = getParsedDifferences(
      `
        export type Bar = number;
        const bar: Bar = 7;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences).toEqual([]);
  });

  it("should not ignore exported declarations", () => {
    const differences = getParsedDifferences(
      `
        export const bar: Bar = 7;
        `,
      `
        const bar = 7;
        `
    );
    expect(differences).toEqual([
      { type: DiffType.Removed, raw: "const bar = 7;" },
      { type: DiffType.Added, raw: "export const bar = 7;" },
    ]);
  });

  it("should not ignore exported functions", () => {
    const differences = getParsedDifferences(
      `
        export default function() {
          type Foo = number;
          return 5;
        };
        `,
      `
        export default function () {
          return 6;
        };
        `
    );
    expect(differences).toEqual([
      { type: DiffType.Removed, raw: "return 6;" },
      { type: DiffType.Added, raw: "return 5;" },
    ]);
  });

  it("should ignore comments", () => {
    const differences = getParsedDifferences(
      `
        // Another comment
        const foo = 5
        `,
      `
        const foo = 5; // Comment
        `
    );
    expect(differences).toEqual([]);
  });
});
