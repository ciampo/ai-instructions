---
name: repository-maintenance
description: Apply repository-aware CLI, package-manager, Git, GitHub, task-title, commit, changelog, and technical-writing conventions. Use when modifying a repository, managing commits, working with GitHub issues or pull requests, or preparing pull-request metadata.
---

# Repository Maintenance

- Read [tools and CLI conventions](references/tools-and-cli.md) before GitHub, Git, dependency, package-manager, or verification operations.
- Read [writing conventions](references/writing-conventions.md) when writing commits, changelogs, pull-request descriptions, public API documentation, or error messages.
- When the runtime supports task titles, derive an accurate subject from verified context and use `<phase emoji> [<work type>#<number>] <subject>` for numbered GitHub work: `I` for an issue, `A` for an authored pull request, and `R` for a reviewed pull request. Omit the reference when there is no primary numbered item, and never invent unavailable metadata.
- Keep the title anchored to the primary task. Correct a generic title when better evidence arrives; otherwise rename it only when the primary task or its phase materially changes.
- Detect and follow the target repository's templates, scripts, package manager, branch policy, release policy, and naming conventions.
- Treat the references as personal defaults only where the target repository has no explicit convention.
- Treat an explicit request to implement a change and open a pull request, or to update an authored or explicitly owned one, as authority for the routine branch, edit, verification, commit, push, and draft-pull-request work needed to deliver it. Review-only requests remain read-only, and narrower user limits always win.
- For an authored pull request, or one whose fix-and-push loop the user explicitly owns, an explicit rebase request also authorizes publishing the verified rewritten task branch with `--force-with-lease` against its recorded remote head. Never use `--force`.
- Do not infer authority for public comments or reviews, thread resolution, ready-for-review transitions, merges, releases, or unrelated pull-request changes. Runtime approval controls remain independent of task intent.
