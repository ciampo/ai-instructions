---
name: write-pr-description
description: Write or update a concise pull-request description from the actual diff, repository template, and behavior-focused testing steps. Use for every PR description change.
---

# Write PR Description

A workflow for writing or updating a PR description. Invoked when I say "write the PR description" or "update the PR description."

## Steps

1. Detect the repo's PR template (look for `.github/PULL_REQUEST_TEMPLATE.md` or similar). If none exists, use the default structure: What / Why / How / Testing Instructions.
2. If updating an existing PR description, read the current description first. Preserve anything that should stay (manually added links, screenshots, reviewer context) and rewrite the rest based on the current state of the code.
3. Read all staged/committed changes to understand the scope.
4. Write the What / Why / How sections in plain, human language. Lead with the outcome and motivation, explain only the implementation detail needed to understand the approach, and prefer one or two sentences per section when possible. A reviewer should grasp the change in 30 seconds without first understanding the code.
5. Write a "Testing Instructions" section that prioritizes manual reproduction and verification:
   - For user-facing changes, name the real app screen or Storybook example, then list the exact interactions and expected result.
   - Prefer steps that reflect what an end user or reviewer actually does.
   - Omit routine lint, type-check, build, and automated test commands already covered by git hooks or CI. Include commands only when the PR changes that infrastructure or they are necessary to reproduce or validate the change.
6. Put secondary implementation and verification details in `<details>` sections when they are useful. This includes API comparisons, migration guides, extended technical context, and non-essential command output.
7. Include a "Visual Preview" section when the change is visual (mention where screenshots/videos should go).
8. Add a "TODO / Follow-ups" section when there is deferred or out-of-scope work.
9. Place related issue/PR links at the top.
10. Keep it concise. If in doubt, cut it.
