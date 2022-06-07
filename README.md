# ts-safe-diff

Diff files in your working directory with ones from a specified commit, and see if any changes were made that would affect the logic of the program, ie. ignoring comments, type annotations, etc.

### Why?

I made this to help determine if you've actually changed the code that would be run after doing something like a large codemod to convert to typescript.

### How?

```sh
$ npx @jonathanusername/ts-safe-diff 9a1adc39117b7ead41a1d38173b22cdc224faefa --paths spec/foo.ts
```

```
Usage: ts-safe-diff <commitSha> --paths src/foo/*.ts src/bar.ts

Positionals:
  commitSha  The commit to diff all files against                       [string]

Options:
      --version      Show version number                               [boolean]
      --help         Show help                                         [boolean]
  -p, --paths        A series of globs to start the runner with, e.g.
                     src/**/*.ts                              [array] [required]
  -x, --ext          If the file you want to compare against had a different
                     extension, use this to specify it, e.g. 'js'       [string]
  -v, --verbose      Passed to jscodeshift                 [number] [default: 0]
  -s, --silent       Passed to jscodeshift            [boolean] [default: false]
  -C, --diffContext  Number of lines for context of the diff, like -C in grep
                                                           [number] [default: 3]
```
