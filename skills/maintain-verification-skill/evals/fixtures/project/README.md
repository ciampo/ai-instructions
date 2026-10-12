# Taskbook

Taskbook is a dependency-free CLI on Node.js 22 or newer. Its existing project-local verification skill is at `.agents/skills/verify-taskbook/`. The product supports `list --format json`; the old `list --json` spelling fails. The title of an added task is trimmed. No command uses the network. Inspect `taskbook.mjs` for the exact behavior.
