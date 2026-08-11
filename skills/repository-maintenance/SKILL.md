---
name: repository-maintenance
description: Apply repository-aware CLI, package-manager, Git, GitHub, task-title, commit, changelog, and technical-writing conventions. Use when modifying a repository, managing commits, working with GitHub issues or pull requests, preparing pull-request metadata, or verifying an approved GitHub Enterprise CLI access route before a repository command. For access-only github.a8c.com or Automattic Enterprise requests, use automattic-github-enterprise instead; use both skills for broader repository work on that host.
---

# Repository Maintenance

- Read [tools and CLI conventions](references/tools-and-cli.md) before GitHub, Git, dependency, package-manager, or verification operations.
- Read [writing conventions](references/writing-conventions.md) when writing commits, changelogs, pull-request descriptions, public API documentation, or error messages.
- When the runtime supports task titles, read the canonical GitHub issue or pull-request title before setting the task title. Use `<purpose emoji> [<work type>#<number>] <canonical title>`: `I` for an issue, `A` for an authored pull request, and `R` for a reviewed pull request. Use the canonical title as the subject. Do not paraphrase it or substitute a generic label such as `Review pull request`. If canonical metadata is unavailable, use a verified user-supplied title. Otherwise preserve an accurate existing title or wait to set one.
- Treat the complete title as the stable identity of the session's primary task, not its current workflow step. After the title is accurate, rename it only to correct verified metadata, when the user replaces the primary task, or when an issue task becomes the authored pull request that is now the session's primary delivery. Do not change its emoji, work type, reference, or subject for iteration, fixes, feedback, rebases, CI, verification, commits, pushes, or follow-up artifacts.
- Detect and follow the target repository's templates, scripts, package manager, branch policy, release policy, and naming conventions.
- Treat the references as personal defaults only where the target repository has no explicit convention.
- Treat an explicit request to implement a change and open a pull request, or to update an authored or explicitly owned one, as authority for the routine branch, edit, verification, commit, push, and draft-pull-request work needed to deliver it. Review-only requests remain read-only, and narrower user limits always win.
- For an authored pull request, or one whose fix-and-push loop the user explicitly owns, an explicit rebase request also authorizes publishing the verified rewritten task branch with `--force-with-lease` against its recorded remote head. Never use `--force`.
- Do not infer authority for public comments or reviews, thread resolution, ready-for-review transitions, merges, releases, or unrelated pull-request changes. Runtime approval controls remain independent of task intent.
