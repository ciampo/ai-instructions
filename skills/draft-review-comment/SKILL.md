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
2. Draft the smallest useful response in a friendly, natural tone. The GitHub thread already supplies context, so do not repeat the original feedback, code location, investigation, or proof in the visible comment unless the reader needs it to understand or act.
   - **Review finding:** Default to one or two short sentences. State the concrete concern and ask for the smallest clear change or clarification. Mention impact only when it is not already obvious.
   - **Reply after a fix:** Default to one short sentence, or two at most: acknowledge the point naturally and state what changed. Add the short commit SHA only when useful. For example: `Good point. Moved the \`balance\` styles to the \`compositions\` layer in abc1234.`
   - **Reply after an oversight:** Own it without a long explanation. For example: `Right, that was an oversight on my end. Restored in abc1234.`
   - **Reply when declining:** Give the high-level reason or trade-off in one or two sentences. Add more only when the disagreement cannot be evaluated without it.
   - Put optional evidence, reproduction steps, implementation detail, or verification in `<details><summary>More context</summary>...</details>`. Do not add a details block when the short response is enough.
   - Avoid formal report language, canned praise, review-process narration, and exhaustive technical justification.
   - Each finding should still give a concrete alternative or ask a clarifying question, but do not force separate problem, impact, and action sentences when one natural sentence covers them.
3. Follow **Output Delivery**. Use one copy-pasteable section per comment thread or review point.
   - Identify an inline finding with its exact file path and line range outside the comment text. Identify a file-level finding with its file path. Do not invent a location for a general finding.
   - Keep artifact metadata, severity, and verification gaps outside the text intended for the GitHub thread unless they materially help the author.
4. **Do not post to GitHub.**
5. If I edit or refine the draft, preserve its delivery mode: update and re-open the existing review document for file delivery, or return only the revised comment or comments for chat delivery.
