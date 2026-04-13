# Writing Conventions

How I expect written artifacts to be structured.

## PR Descriptions

- **[STRONG]** Follow the repo's existing PR template. If no template exists, use: What / Why / How / Testing Instructions.
- **[STRONG]** Keep the summary concise and human-scannable. A reviewer should understand the PR in 30 seconds.
- **[PREFER]** Use `<details>` sections for implementation details, API comparison tables, and extended context that most readers can skip.
- **[STRONG]** Include a "Testing Instructions" section with concrete steps.
- **[PREFER]** Include a "Visual Preview" section (screenshots/videos) when the change is visual.
- **[PREFER]** Add a "TODO / Follow-ups" section when there is deferred work.
- **[PREFER]** When referencing related issues or PRs, put them at the top.

## Commit Messages

- **[STRONG]** Granular commits that group logically by concern. Each commit should be a coherent unit of change.
- **[STRONG]** Format: `ComponentName: Short description of change` (or `area: description` for non-component work).
- **[PREFER]** When squashing, the resulting message should still be meaningful.

<details>
<summary>Example: commit messages</summary>

```text
Dialog: Fix focus not returning to trigger on close
Tooltip: Add `delayDuration` prop
build: Update Radix Tooltip from v1 to v2
docs: Add migration guide for Button API changes
```

</details>

## CHANGELOG Entries

- **[RULE]** Always include them for user-facing changes. Use the correct category (Internal, Enhancement, New Feature, Bug Fix, Breaking Change).
- **[STRONG]** Include PR link in `([#NNNNN](URL))` format.
- **[RULE]** Match the existing CHANGELOG format and conventions in the repo exactly.

<details>
<summary>Example: CHANGELOG entry</summary>

```md
## Bug Fix

- `Dialog`: Fix focus not returning to the trigger element when the dialog is closed via Escape key. ([#1234](https://github.com/org/repo/pull/1234))
```

</details>

## Branch Names

See `naming-conventions.md` (Branches section) for the canonical branch naming convention.

## JSDoc / API Documentation

- **[STRONG]** Required on all exported components and public API surfaces.
- **[RULE]** Describe behavior and constraints, not implementation internals. Do not mention internal/upstream libraries in public-facing docs.
- **[PREFER]** Include usage examples when the pattern is non-obvious.
- **[PREFER]** Prefer guidance over prescription: "Most of the time you should do X because Y. If you do Z instead, the consequence is W" -- not "You must always X."

## Error Messages

- **[STRONG]** Concise but informative. Format: `ComponentName: Summary. Detail sentence.`
- **[PREFER]** Include accessibility context when the error relates to ARIA patterns or focus management.
