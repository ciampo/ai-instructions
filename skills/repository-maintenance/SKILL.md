---
name: repository-maintenance
description: Apply repository-aware CLI, package-manager, Git, GitHub, task-title, commit, changelog, and technical-writing conventions. Use when modifying a repository, managing commits, working with GitHub issues or pull requests, or preparing pull-request metadata.
---

# Repository Maintenance

- Read [tools and CLI conventions](references/tools-and-cli.md) before GitHub, Git, dependency, package-manager, or verification operations.
- Read [writing conventions](references/writing-conventions.md) when writing commits, changelogs, pull-request descriptions, public API documentation, or error messages.
- When the runtime supports task titles, begin each managed title with one intuitive phase emoji. For numbered GitHub work, use `<phase emoji> [<work type>#<number>] <task subject>`: `I` for an issue, `A` for a pull request being authored, or `R` for a pull request being reviewed. Use `🔍` for investigation, `🛠️` for implementation or authoring, `🔧` for focused fixes, `📄` for documentation, `👀` for pull-request review, `💬` for feedback, `🚦` for CI, `🧪` for verification, or `🎨` for design. Without a primary issue or pull request, omit the bracketed reference.
- Before naming GitHub issue or pull-request work, read the canonical title and enough of the description to understand the outcome. Use that metadata to write an accurate, task-specific subject; do not require the source title's exact wording or fall back to a generic repository or activity label. Prefer concise wording when it preserves the task's meaning. If canonical metadata cannot be read, use user-supplied or otherwise verified task context. If that context is insufficient, keep the current anchored title or wait to set one instead of guessing.
- Treat the user's primary task as the title anchor. Correct a generic or inaccurate title when verified task context becomes available, then do not rename it for a supporting action or follow-up artifact. Otherwise, re-evaluate the title only when the primary work type changes or the task enters a materially different phase. Keep the primary reference and subject stable when only the phase changes. If the user makes multiple objectives co-equal, keep the primary reference and combine their subjects. Prefer concise wording only when it preserves each objective's meaning.
- Detect and follow the target repository's templates, scripts, package manager, branch policy, release policy, and naming conventions.
- Treat the references as personal defaults only where the target repository has no explicit convention.
- Treat this as a supporting skill, not an authority grant. The calling request still controls whether local edits, commits, pushes, pull-request writes, releases, or publication are allowed.
