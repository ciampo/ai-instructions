# ADR 0007: Replace the Default Gemini Adapter with Antigravity CLI

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

Gemini CLI no longer supports individual OAuth, and no enterprise, Google Cloud, or paid API profile has current direct-skill acceptance evidence. Continuing to advertise a Gemini preview adapter would make an unsupported authentication path look maintained.

Google Antigravity CLI 1.1.5 retains the global `~/.gemini/GEMINI.md` context but uses `~/.gemini/antigravity-cli/skills/` for global skills. Its migration guide explicitly distinguishes that native path from Gemini's legacy `~/.gemini/skills/` location.

Installing both paths would expose duplicate skills. Removing the legacy directory indiscriminately would risk deleting user-authored skills.

## Decision

Google Antigravity CLI is the supported Google preview surface. Gemini CLI is unsupported by default and is not an active installer target.

The Antigravity adapter:

- generates the managed `~/.gemini/AGENTS.md` and `~/.gemini/GEMINI.md` wrapper pair;
- installs complete Agent Skill directories to `~/.gemini/antigravity-cli/skills/`;
- migrates repository-managed skill directories from `~/.gemini/skills/` during install or update; and
- preserves user-owned legacy skill directories and all unrelated Gemini configuration.

## Consequences

- The Google surface remains `preview` until current Antigravity discovery and behavior canaries pass from the native paths.
- Existing individual Gemini users receive an ownership-safe migration instead of duplicate global skills.
- Reintroducing Gemini requires a separate manifest adapter and current authenticated acceptance evidence for every retained context.

## Sources Reviewed

- [Antigravity CLI Gemini migration](https://antigravity.google/docs/cli/gcli-migration)
- [Antigravity CLI plugins and skills](https://antigravity.google/docs/cli/plugins)
