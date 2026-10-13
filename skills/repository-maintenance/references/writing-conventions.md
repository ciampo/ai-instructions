# Writing Conventions Reference

How I expect written artifacts to be structured.

## Default compression

- Lead with the result, decision, or requested action.
- Keep only details that help the reader evaluate or act on that result. Omit process narration, repeated context, failed approaches, routine verification, and background that does not change the conclusion.
- State each point once. Do not repeat a finding in both a summary and a detailed section unless the user requested an executive summary.
- Prefer a short paragraph over a heading and list for a single point. Add structure only when the artifact has distinct parts.
- Expand when risk, uncertainty, or required instructions make the extra detail necessary. Put optional supporting evidence in `<details>` when the target format supports it.

## Technical clarity and conversational tone

- Make technical explanations easy to follow on the first read. Name what happens, why it happens, and its consequence in that order when those points matter. Use separate sentences rather than packing several mechanisms into technical shorthand.
- Keep exact identifiers and necessary terms. Explain an unfamiliar concept briefly where it first matters, using a concrete example when that is clearer. Preserve evidence, uncertainty, and conditions. More words are useful when they prevent the reader from having to decode the explanation.
- In review comments, replies, and discussions, sound like a professional, friendly teammate. Use natural phrasing and contractions when appropriate. Acknowledge a useful point briefly, and explain disagreement directly and respectfully. Avoid canned praise, formal report language, and forced familiarity.

## Plain-language repair

When the user asks for `bro`, `say that simply`, plain English, or equivalent wording while drafting an artifact covered by this reference, simplify it without changing its substance:

- Lead with the main point. Use short sentences.
- Preserve every conclusion, constraint, caveat, piece of evidence, uncertainty, exact identifier, and explanation the source gives for a technical term.
- Replace unnecessary jargon. Briefly explain each necessary technical concept in source-supported everyday language. Keep technical relationships exact: for example, do not rewrite `behind` a flag as `disabled`. Keep evidence-status terms verbatim when a substitute could change scope. If the source says `reproduced` or `not reproduced`, use those exact terms; they do not mean `occurs` or `did not occur`. Do not infer what an identifier does or what state it has.
- Remove decorative metaphors, repetition, and filler.
- Do not add claims or make existing claims more certain.

## PR Descriptions

- **[STRONG]** Follow the repo's required PR template. If no template exists, use Summary and Testing Instructions.
- **[STRONG]** Keep the opening to one short paragraph, usually one or two sentences total. State the problem and resulting behavior. If the template separates What / Why / How, aim for one short sentence each without repeating the same point.
- **[RULE]** Keep necessary breaking changes, migration requirements, and material limitations visible. A reviewer must be able to understand the change and essential caveats with every details block closed.
- **[STRONG]** Cut secondary context that does not help review. Put useful implementation explanations, API comparisons, extended migration guidance, and verification evidence in closed `<details>` blocks with descriptive `<summary>` labels and blank lines around the Markdown content. Do not repeat the opening or add a block just to fill it.
- **[RULE]** Prioritize manual, behavior-focused testing instructions. Point reviewers to the real app or relevant Storybook example and describe the exact interactions and expected result for user-facing changes.
- **[RULE]** Do not clutter testing instructions with routine lint, type-check, build, or automated test commands that already run in git hooks or CI. Include commands when the PR changes that infrastructure or when they are necessary to reproduce or validate the change; put secondary verification details in `<details>` when useful.
- **[PREFER]** Include a "Visual Preview" section (screenshots/videos) when the change is visual.
- **[PREFER]** Add a "TODO / Follow-ups" section when there is deferred work.
- **[PREFER]** When referencing related issues or PRs, put them at the top.

## PR Review Comments and Replies

- Default to the shortest response that works in the existing GitHub thread. Do not restate context the thread already shows.
- For a finding, use one or two natural sentences: the concrete concern and the requested change or question. Mention impact only when it is not obvious.
- For an accepted fix, acknowledge the point and state the outcome, usually in one or two short sentences. Add the short commit SHA only when useful.
- Treat sentence counts as defaults, not a reason to compress a technical explanation. Add a short explanation when the reader needs it to understand the concern, outcome, or disagreement.
- Keep investigation notes, implementation detail, and routine verification out of the visible comment. Put genuinely useful optional context in `<details>`.
- Use the conversational tone above for copy-pasteable comments and replies. Keep report metadata and investigation notes separate from that text.

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
- **[STRONG]** Explain technical behavior in short, connected sentences. State the relevant condition and consequence explicitly. Do not assume a reader knows an internal term or compress several concepts into one phrase.
- **[PREFER]** Include usage examples when the pattern is non-obvious.
- **[PREFER]** Prefer guidance over prescription: "Most of the time you should do X because Y. If you do Z instead, the consequence is W" -- not "You must always X."

## Error Messages

- **[STRONG]** Concise but informative. Format: `ComponentName: Summary. Detail sentence.`
- **[PREFER]** Include accessibility context when the error relates to ARIA patterns or focus management.
