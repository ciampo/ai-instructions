# List tasks

Read saved tasks without creating or changing data.

## Sub-features

- `list-empty`: return an empty array when no tasks are stored.
- `list-populated`: return saved tasks without changing their values.

## How to get to it

Run `node taskbook.mjs list --json` from the project root.

## Driving it

From an absent data directory, run `node taskbook.mjs list --json`. Expect exit code 0, stdout `[]`, and no created data files. After adding a task through the add recipe, run the same list command and expect the saved ID and title. Capture command, output, and exit status, and confirm reading did not change the saved file.

## Gotchas

A successful empty list does not prove a populated list. Keep their evidence separate.
