---
name: draft-review-comment
description: Draft concise, self-contained GitHub review comments in a portable Markdown document without posting them. Use directly or from PR review workflows.
---

# Draft Review Comment

A workflow for crafting review comments ready to paste into GitHub. Invoked when I say "help me craft a comment" or "prepare a review comment."

This is a supporting skill — typically chained into by `review-pr`, `self-review-pr`, and `address-pr-feedback` rather than invoked directly.

## Output Delivery

All review output goes into a **single markdown document** — never inline in the chat.

1. Write findings to a file in the **OS temporary directory** (e.g., `$TMPDIR` on macOS, `/tmp` on Linux). Use a descriptive name such as `<pr-number>-review.md` (or `review-<timestamp>.md` when no PR number is available). Calling skills may override the filename (e.g., `-self-review.md`, `-replies.md`). On update (e.g., multi-round reviews), **overwrite the file** with the full revised content — do not append.
2. Open the file in the current editor when the host exposes that capability. Otherwise, provide the path so it can be opened manually.
3. In the chat, only print a one-line confirmation with the file path — nothing else.

## Steps

1. Understand the context: what PR, what specific code or concern the comment addresses.
2. Draft the comment in a concise, collaborative, constructive tone. Lead with plain language and use `<details>` for extended technical content.
   - Lead with a high-level explanation of the result, concern, or decision before discussing code mechanics.
   - When the behavior can be observed, include short reproduction or verification steps: where to go, what to do, and what to expect.
   - Keep implementation details and suggested diffs secondary. Put them in `<details>` when the comment is understandable without them.
   - Acknowledge what the PR does well only when it adds useful context. Keep it to one sentence and do not let it delay the main point.
   - Each inline comment must specify the **exact file path and line range** it applies to, so I know where to leave it on GitHub (e.g., **`src/components/Button.tsx:42-45`**).
   - Each feedback item should propose a concrete alternative or ask a clarifying question.
3. Compose all findings into the review document described in **Output Delivery**. One section per comment thread or review point — each self-contained and copy-pasteable.
4. **Do NOT post to GitHub.** Never use `gh pr comment`, `gh pr review`, or any GitHub write operation.
5. If I edit or refine the draft, update the same review document and re-open it.
