---
name: write-pr-description
description: Draft a concise pull-request description locally from the actual diff, repository template, and behavior-focused testing steps, or apply it to GitHub when explicitly authorized. Use for every PR description change; drafting does not imply remote-write authority.
---

# Write PR Description

A workflow for writing or updating a PR description. Invoked when I say "write the PR description" or "update the PR description."

## Authority and output

By default, return the description as Markdown in chat or write it to a user-requested local file. Apply it to GitHub only when the user explicitly asks to update, create, or open the pull request. Preserve manually authored remote content when updating an existing description.

Matching standing evaluation consent may authorize updating only the Evaluation section of its recorded authored draft pull request. Verify the target branch and exact current head, and preserve all other content and metadata.

## Steps

1. Read the repository template, current description when updating one, and actual diff. Preserve relevant manual content. Reading remote content does not authorize changing it.
2. Place related issue or pull-request links first.
3. Write concise What / Why / How sections. Lead with the outcome and motivation, and include only implementation detail needed to understand the approach.
4. Write Testing Instructions that prioritize manual reproduction and verification:
   - For user-facing changes, name the real app screen or Storybook example, then list the exact interactions and expected result.
   - Prefer steps that reflect what an end user or reviewer actually does.
   - Omit routine lint, type-check, build, and automated test commands already covered by git hooks or CI. Include commands only when the PR changes that infrastructure or they are necessary to reproduce or validate the change.
5. Add Visual Preview or TODO / Follow-ups sections only when relevant. Put secondary technical and verification detail in `<details>`.
6. Keep it concise. If in doubt, cut it.
7. Deliver the Markdown locally unless the request already authorizes the GitHub write. Report whether the remote description changed.
