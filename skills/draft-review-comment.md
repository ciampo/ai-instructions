# Skill: Draft Review Comment

A workflow for crafting a review comment I can paste into GitHub. Invoked when I say "help me craft a comment" or "prepare a review comment."

## Steps

1. Understand the context: what PR, what specific code or concern the comment addresses.
2. Draft the comment following the writing style and tone from `interaction-preferences.md` (GitHub comment writing style section). In short: concise, collaborative, constructive, `<details>` for extended content.
   - Start by briefly acknowledging what the PR does well (1 sentence max), then get to the feedback.
   - Each feedback item should reference the relevant code and propose a concrete alternative or ask a clarifying question.
3. Output each comment as a **separate, self-contained markdown snippet** in the chat that I can copy-paste individually. One snippet per comment thread or review point.
4. **Do NOT post to GitHub.** Never use `gh pr comment`, `gh pr review`, or any GitHub write operation. Only share in the conversation.
5. If I edit or refine the draft, incorporate changes and re-output the updated version.
