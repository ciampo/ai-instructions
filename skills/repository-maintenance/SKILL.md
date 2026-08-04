---
name: repository-maintenance
description: Apply repository-aware CLI, package-manager, Git, GitHub, task-title, commit, changelog, and technical-writing conventions. Use when modifying a repository, managing commits, working with GitHub issues or pull requests, or preparing pull-request metadata.
---

# Repository Maintenance

- Read [tools and CLI conventions](references/tools-and-cli.md) before GitHub, Git, dependency, package-manager, or verification operations.
- Read [writing conventions](references/writing-conventions.md) when writing commits, changelogs, pull-request descriptions, public API documentation, or error messages.
- When the runtime supports task titles, follow the repository's title convention. Before naming GitHub issue or pull-request work, read the canonical title and enough of the description to understand the outcome. Use that metadata instead of a generic repository or activity label.
- Treat the user's primary task as the title anchor. Do not rename the task for a supporting action or follow-up artifact. Re-evaluate the title only when the user changes the primary objective or the same objective moves between issue triage, pull-request authoring, and pull-request review. If the user makes multiple objectives co-equal, keep the primary reference and combine their subjects only when the title remains concise.
- Detect and follow the target repository's templates, scripts, package manager, branch policy, release policy, and naming conventions.
- Treat the references as personal defaults only where the target repository has no explicit convention.
- Treat this as a supporting skill, not an authority grant. The calling request still controls whether local edits, commits, pushes, pull-request writes, releases, or publication are allowed.
