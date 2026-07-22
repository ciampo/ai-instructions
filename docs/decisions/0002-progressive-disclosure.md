# ADR 0002: Keep Only Personal Boundaries Always On

- **Status:** Accepted
- **Date:** 2026-07-21

## Context

The original installer loaded every instruction file in every session. Framework, design-system, accessibility, security, performance, release, GitHub, and writing guidance consumed roughly 54 KB in Codex before a repository's own instructions were considered. Some rules also represented repository conventions or technology preferences as universal requirements.

All targeted products now support Agent Skills with description-based discovery. Skills can carry references that load only after the skill activates.

## Decision

Keep a single product-neutral `AGENTS.md` for communication, verification, authority, safety, implementation, and delivery boundaries that genuinely apply everywhere.

Move other guidance into three kinds of skill content:

- task procedures, such as review, debugging, releases, and refactors;
- repository-maintenance conventions, loaded for Git, package, changelog, and pull-request work;
- engineering standards, whose entrypoint routes to only the relevant technology or risk reference.

Use the portable Agent Skills common format for shared sources. Do not add vendor-only path or invocation metadata to canonical frontmatter; generate a product adapter only when a concrete consumer requires behavior the common format cannot represent.

Regression-limit the generated universal artifact to 150 lines and 8 KB. Validate skill names, descriptions, links, bundled resources, platform contracts, and source-review dates in CI.

## Consequences

- Unrelated sessions receive a small, stable personal core instead of framework-specific context.
- Skill descriptions become routing APIs and need review when scope changes.
- Installed skills must include their entire directory, not only `SKILL.md`.
- Default directory symlinks expose edits, additions, and removals immediately; copy-mode installations require an installer update.
- Repository-specific conventions override personal defaults unless a core boundary explicitly says otherwise.
