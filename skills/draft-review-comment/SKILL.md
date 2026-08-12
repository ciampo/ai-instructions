---
name: draft-review-comment
description: Draft concise GitHub review comments or replies from supplied feedback or confirmed findings without posting. Use only for direct wording requests or after a PR workflow delegates final wording. For a direct request, load this skill before inspecting the workspace or drafting; report a load blocker. Parent workflows load it only for final wording. Do not review a PR, implement or address feedback, or preload it during a feedback-fix workflow. Support inline, file-level, and general findings. Use chat delivery only when requested.
---

# Draft Review Comment

Craft review comments that are ready to paste into GitHub. This skill can handle a direct wording request or the final wording step from another PR workflow.

## Output Delivery

- By default, put all findings in one Markdown document in the **OS temporary directory**. Use a name such as `<pr-number>-review.md` or `review-<timestamp>.md`. Calling skills can use a suffix such as `-self-review.md` or `-replies.md`. Overwrite the full document on updates; do not append.
- `chat only` and `no artifact` require chat delivery. `do not write files` and `do not modify files` prohibit all local writes, including source edits and review artifacts, and also require chat delivery. These phrases do not otherwise change the source-edit authority of the calling workflow.
- When a document is written, open it in the current editor if supported. Otherwise, return its path. In chat, print only a one-line confirmation with that path.
- For chat delivery, do not create or open a local file. Return only the requested copy-pasteable comments.

## Steps

1. Identify the pull request, code, and concern that each comment addresses.
2. Use a concise, collaborative tone. Lead with plain language and put extended technical content in `<details>`.
   - Lead with a high-level explanation of the result, concern, or decision before discussing code mechanics.
   - When the behavior can be observed, include short reproduction or verification steps: where to go, what to do, and what to expect.
   - Keep implementation details and suggested diffs secondary. Put them in `<details>` when the comment is understandable without them.
   - Acknowledge what the PR does well only when it adds useful context. Keep it to one sentence and do not let it delay the main point.
   - Inline findings must specify the **exact file path and line range** they apply to (e.g., **`src/components/Button.tsx:42-45`**). File-level findings need the file path but no invented line. General or architectural findings may omit a code location when no honest location exists.
   - Each feedback item should propose a concrete alternative or ask a clarifying question.
3. Follow **Output Delivery**. Use one self-contained, copy-pasteable section per comment thread or review point.
4. **Do not post to GitHub.**
5. If I edit or refine the draft, preserve its delivery mode: update and re-open the existing review document for file delivery, or return only the revised comment or comments for chat delivery.
