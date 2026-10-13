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
3. Follow the repository's required headings. Without a template, use Summary and Testing Instructions. Keep the opening to one short paragraph, usually one or two sentences total, explaining the problem and resulting behavior. If the template separates What / Why / How, aim for one short sentence each without repeating the same point. Keep a necessary breaking change, migration requirement, or material limitation visible.
4. Write Testing Instructions that prioritize manual reproduction and verification:
   - For user-facing changes, name the real app screen or Storybook example, then list the exact interactions and expected result.
   - Prefer steps that reflect what an end user or reviewer actually does.
   - Omit routine lint, type-check, build, and automated test commands already covered by git hooks or CI. Include commands only when the PR changes that infrastructure or they are necessary to reproduce or validate the change.
5. Add Visual Preview or TODO / Follow-ups sections only when relevant. Cut details that do not help a reviewer. Put useful implementation explanations, alternatives, API comparisons, and extended verification in closed `<details>` blocks with descriptive `<summary>` labels. Leave blank lines around Markdown inside each block. Do not repeat the opening inside the block or add one when there is no useful detail. For authorized local image or video uploads, load `repository-maintenance` and follow its GitHub attachment guidance. A local draft alone does not authorize uploads.
6. Read the description with every `<details>` block closed. The reviewer should see the problem, result, essential caveats, and how to check the change. Cut repeated background and file-by-file narration. Explain necessary technical terms in plain language, and split dense explanations instead of compressing them into jargon to meet the length target.
7. Deliver the Markdown locally unless the request already authorizes the GitHub write. Report whether the remote description changed.
