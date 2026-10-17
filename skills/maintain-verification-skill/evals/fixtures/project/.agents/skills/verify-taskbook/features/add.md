# Add tasks

Add a titled task and confirm it persists.

## Sub-features

- `add-title`: trim and store a nonempty title.
- `add-empty`: reject an empty title without changing stored tasks.

## How to get to it

Run `node taskbook.mjs add <title>` from the project root.

## Driving it

Start with empty disposable data. Run `node taskbook.mjs add "  Release checklist  "`. Expect exit code 0 and a JSON task with ID 1 and title `Release checklist`. Run `node taskbook.mjs list --json` and expect the stored task with the trimmed title. Run `node taskbook.mjs add ""` and expect exit code 2. Repeat the list command and expect unchanged stored data. Capture each command and result.

## Gotchas

Check persistence through the public list command. Empty-title failure is expected; run doctor before resuming. Evidence must survive removal of the disposable data directory.
