# Writing Conventions Reference

How I expect written artifacts to be structured.

## Plain-language repair

When the user asks for `bro`, `say that simply`, plain English, or equivalent wording, simplify the current explanation or artifact without changing its substance:

- Lead with the main point. Use short sentences.
- Preserve conclusions, constraints, caveats, evidence, uncertainty, and exact identifiers.
- Replace unnecessary jargon. Explain technical terms that are still required.
- Remove decorative metaphors, repetition, and filler.
- Do not add claims or make existing claims more certain.

## PR Descriptions

- **[STRONG]** Follow the repo's existing PR template. If no template exists, use: What / Why / How / Testing Instructions.
- **[RULE]** Optimize the What / Why / How sections for human comprehension. Start with the high-level outcome or reason, use plain language, and avoid low-level implementation details unless they are necessary to understand the change. Prefer one or two sentences per section when possible.
- **[STRONG]** Keep the summary concise and easy to scan. A reviewer should understand the change in 30 seconds without needing deep knowledge of the code.
- **[PREFER]** Put implementation details, API comparison tables, migration guides, and other secondary context in `<details>` sections.
- **[RULE]** Prioritize manual, behavior-focused testing instructions. Point reviewers to the real app or relevant Storybook example and describe the exact interactions and expected result for user-facing changes.
- **[RULE]** Do not clutter testing instructions with routine lint, type-check, build, or automated test commands that already run in git hooks or CI. Include commands when the PR changes that infrastructure or when they are necessary to reproduce or validate the change; put secondary verification details in `<details>` when useful.
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

- **[RULE]** Follow the target repository's release policy. When it requires a changelog entry for the change, use the correct category (Internal, Enhancement, New Feature, Bug Fix, Breaking Change).
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

Follow the target repository's branch convention. When none exists, prefer `type/short-description`, such as `fix/focus-trap-escape` or `docs/migration-guide`.

## JSDoc / API Documentation

- **[STRONG]** Follow the target repository's API-documentation policy. Add JSDoc to exported components and public APIs when required locally or when it clarifies behavior, constraints, or non-obvious usage.
- **[RULE]** Describe behavior and constraints, not implementation internals. Do not mention internal/upstream libraries in public-facing docs.
- **[PREFER]** Include usage examples when the pattern is non-obvious.
- **[PREFER]** Prefer guidance over prescription: "Most of the time you should do X because Y. If you do Z instead, the consequence is W" -- not "You must always X."

## Error Messages

- **[STRONG]** Concise but informative. Format: `ComponentName: Summary. Detail sentence.`
- **[PREFER]** Include accessibility context when the error relates to ARIA patterns or focus management.
