# Taskbook

Taskbook is a dependency-free CLI on Node.js 22 or newer. Run it from the project root with `node taskbook.mjs`. Use an absolute disposable directory in `TASKBOOK_DATA_DIR`; no command uses the network.

- `--version` reports the build without writing files.
- `doctor` reports the version and configured data directory without creating it.
- `add "Release checklist"` saves a task and prints its ID and trimmed title as JSON. Empty titles fail with exit code 2.
- `list --format json` reads saved tasks as JSON. A missing data file produces an empty array without creating files.

The project uses `.agents/skills/` for local skills. Do not alter the existing `project-notes` skill. Task data is disposable; proof transcripts must survive its removal.
