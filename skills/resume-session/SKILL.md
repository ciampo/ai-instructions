---
name: resume-session
description: Recover and verify the state of unfinished work from available transcripts, notes, git state, and remote PRs before proposing the next steps. Use when resuming prior work.
---

# Resume Session

A workflow for picking up work from a previous session. Invoked when I say "continue where we left off", "pick up from last time", "resume", or reference a previous conversation.

## Steps

1. **Recover context**: Read the last conversation transcript, session notes, or whatever context the host makes available. If history is unavailable, say so and continue from repository evidence rather than inventing prior decisions.
2. **Summarize the state**: Present a brief summary of:
   - What was being worked on.
   - What was completed.
   - What was in progress or remaining.
   - Any open questions or blockers from the previous session.
3. **Check the current state**: Verify the actual state of the codebase and branches:
   - `git status` and `git log` to see what was committed.
   - Check for any uncommitted changes or stashed work.
   - Check if PRs were opened and their current status.
4. **Propose a plan**: Based on the summary and current state, propose the next steps. Be specific: which files, which tasks, in which order.
5. **Wait for confirmation**: Do not start executing until I confirm the plan or adjust it. The previous session's context may be stale or my priorities may have shifted.
