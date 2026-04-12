# Writing Conventions

How I expect written artifacts to be structured.

## PR Descriptions

- Follow the repo's existing PR template. If no template exists, use: What / Why / How / Testing Instructions.
- Keep the summary concise and human-scannable. A reviewer should understand the PR in 30 seconds.
- Use `<details>` sections for implementation details, API comparison tables, and extended context that most readers can skip.
- Include a "Testing Instructions" section with concrete steps.
- Include a "Visual Preview" section (screenshots/videos) when the change is visual.
- Add a "TODO / Follow-ups" section when there is deferred work.
- When referencing related issues or PRs, put them at the top.

## Commit Messages

- Granular commits that group logically by concern. Each commit should be a coherent unit of change.
- Format: `ComponentName: Short description of change` (or `area: description` for non-component work).
- When squashing, the resulting message should still be meaningful.

## CHANGELOG Entries

- Always include them for user-facing changes. Use the correct category (Internal, Enhancement, New Feature, Bug Fix, Breaking Change).
- Include PR link in `([#NNNNN](URL))` format.
- Match the existing CHANGELOG format and conventions in the repo exactly.

## JSDoc / API Documentation

- Required on all exported components and public API surfaces.
- Describe behavior and constraints, not implementation internals. Do not mention internal/upstream libraries in public-facing docs.
- Include usage examples when the pattern is non-obvious.
- Prefer guidance over prescription: "Most of the time you should do X because Y. If you do Z instead, the consequence is W" -- not "You must always X."

## Error Messages

- Concise but informative. Format: `ComponentName: Summary. Detail sentence.`
- Include accessibility context when the error relates to ARIA patterns or focus management.
