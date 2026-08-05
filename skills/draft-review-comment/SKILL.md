---
name: draft-review-comment
description: Draft concise, self-contained GitHub review comments or replies from supplied feedback or confirmed findings without posting them. Use only when asked to write, rewrite, or refine comment or reply text, or after a PR workflow explicitly delegates its final wording step. When selected, load this skill before inspecting the workspace or drafting; report a load blocker instead of using an assumed fallback. Do not perform a PR review, implement or address feedback, or preload this skill during a feedback-fix workflow. Support inline, file-level, and general findings, with chat delivery only when explicitly requested.
---

# Draft Review Comment

A workflow for crafting review comments ready to paste into GitHub. Invoked when I say "help me craft a comment" or "prepare a review comment."

This is a supporting skill — typically chained into by `review-pr`, `self-review-pr`, and `address-pr-feedback` rather than invoked directly.

## Output Delivery

Multi-finding review output goes into a **single Markdown document** by default. `chat only` and `no artifact` select chat delivery without changing any source-edit authority held by the calling workflow. `do not write files` and `do not modify files` prohibit all local file writes, including review artifacts and source edits, and therefore also require chat delivery. In either chat mode, return only the requested concise, copy-pasteable comment or comments in chat and do not create or open a local file.

1. For default document delivery, write findings to a file in the **OS temporary directory** (e.g., `$TMPDIR` on macOS, `/tmp` on Linux). Use a descriptive name such as `<pr-number>-review.md` (or `review-<timestamp>.md` when no PR number is available). Calling skills may override the filename (e.g., `-self-review.md`, `-replies.md`). On update (e.g., multi-round reviews), **overwrite the file** with the full revised content — do not append.
2. When a file was written, open it in the current editor if the host exposes that capability. Otherwise, provide the path so it can be opened manually. In chat, print only a one-line confirmation with the file path.
3. For chat delivery, skip file creation and return only the requested comment or comments.

## Steps

1. Understand the context: what PR, what specific code or concern the comment addresses.
2. Draft the comment in a concise, collaborative, constructive tone. Lead with plain language and use `<details>` for extended technical content.
   - Lead with a high-level explanation of the result, concern, or decision before discussing code mechanics.
   - When the behavior can be observed, include short reproduction or verification steps: where to go, what to do, and what to expect.
   - Keep implementation details and suggested diffs secondary. Put them in `<details>` when the comment is understandable without them.
   - Acknowledge what the PR does well only when it adds useful context. Keep it to one sentence and do not let it delay the main point.
   - Inline findings must specify the **exact file path and line range** they apply to (e.g., **`src/components/Button.tsx:42-45`**). File-level findings need the file path but no invented line. General or architectural findings may omit a code location when no honest location exists.
   - Each feedback item should propose a concrete alternative or ask a clarifying question.
3. Compose all findings into the review document described in **Output Delivery**, unless those delivery rules require chat. Use one section per comment thread or review point, and make each self-contained and copy-pasteable.
4. **Do not post to GitHub.**
5. If I edit or refine the draft, preserve its delivery mode: update and re-open the existing review document for file delivery, or return only the revised comment or comments for chat delivery.
