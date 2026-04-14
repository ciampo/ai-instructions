# Skill: Draft Review Comment

A workflow for crafting review comments ready to paste into GitHub. Invoked when I say "help me craft a comment" or "prepare a review comment."

## Dependencies

Load these instruction files before executing this skill:

- `instructions/interaction-preferences.md`
- `instructions/writing-conventions.md`

## Output Delivery

All review output goes into a **single markdown document** — never inline in the chat.

1. Write findings to a file at `.ai-reviews/<pr-number>-review.md` (or `.ai-reviews/review-<timestamp>.md` when no PR number is available).
2. Open the file in the current editor so I can read it immediately.
3. In the chat, only print a one-line confirmation with the file path — nothing else.

## Steps

1. Understand the context: what PR, what specific code or concern the comment addresses.
2. Draft the comment following the writing style and tone from `interaction-preferences.md` (GitHub comment writing style section). In short: concise, collaborative, constructive, `<details>` for extended content.
   - Start by briefly acknowledging what the PR does well (1 sentence max), then get to the feedback.
   - Each inline comment must specify the **exact file path and line range** it applies to, so I know where to leave it on GitHub (e.g., `**`src/components/Button.tsx:42-45`**`).
   - Each feedback item should propose a concrete alternative or ask a clarifying question.
3. Compose all findings into the review document described in **Output Delivery**. One section per comment thread or review point — each self-contained and copy-pasteable.
4. **Do NOT post to GitHub.** Never use `gh pr comment`, `gh pr review`, or any GitHub write operation.
5. If I edit or refine the draft, update the same review document and re-open it.
