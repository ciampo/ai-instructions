# Confirmed review findings

Draft only the supplied findings. Do not inspect other source or post anything to GitHub.

1. Inline finding at `src/dialog.js:42-46`: Escape closes the dialog but does not return focus to its trigger. Recommend restoring focus after close.
2. File-level finding in `docs/migration.md`: the guide omits the required configuration rename. No exact line was supplied.
3. General finding: the rollout plan has no rollback condition. No single file or line applies.

Each comment must be ready to paste into the relevant review thread. Keep the supplied location as artifact metadata instead of repeating it in the comment.
