---
name: verify-taskbook
description: Verify Taskbook add and list commands with disposable CLI data.
---

# Verify Taskbook

## Launch

Use Node.js 22 or newer from the project root. Create a run directory outside the checkout with separate `data/` and `evidence/` directories. Set `TASKBOOK_DATA_DIR` to the absolute `data/` path. Each CLI invocation is a fresh process. No install, build, server, or PTY is needed.

## Doctor

Run `node taskbook.mjs --version` and `node taskbook.mjs doctor`. Require version `1.0.0` and the run's configured data directory. Both checks are read-only. Repeat after failed commands.

## Drive

Read the feature map. Drive the CLI through its documented public commands.

## Evidence

Save each action's command, stdout, stderr, and exit code under `evidence/`. Record the feature and entry point. Use `node taskbook.mjs list --json` for a public persistence check. Never put evidence under `data/`.

## Cleanup

Remove only this run's `data/` directory and unset its data variable. No background process is started. Preserve `evidence/` and check the proof files still exist.
