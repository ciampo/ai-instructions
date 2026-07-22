---
name: resume-session
description: Recover and verify unfinished work from available transcripts, notes, Git state, and remote PRs, then continue safe in-scope work under the original authority. Use when asked to resume; ask only when recovered state leaves a material choice unresolved, and never treat resumption as new commit or remote-write authority.
---

# Resume Session

A workflow for picking up work from a previous session. Invoked when I say "continue where we left off", "pick up from last time", "resume", or reference a previous conversation.

## Authority

Carry forward only the authority supported by the recovered request and current user instruction. A request to continue is enough to resume safe work already in scope; it does not newly authorize commits, pushes, pull-request writes, releases, publication, destructive operations, or an expansion of scope.

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
4. **Choose the next action**: Based on the recovered request and current state, state the next steps and continue with safe, reversible work that is clearly within the existing scope.
5. **Ask only on a material fork**: Pause for confirmation when the recovered state is ambiguous, stale in a way that changes the outcome, or leaves a choice that would materially alter scope, authority, or implementation. Otherwise continue and report progress.
