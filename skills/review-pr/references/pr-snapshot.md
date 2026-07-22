# Pull-Request Snapshot Procedure

Use this procedure before a remote PR review, self-review, or feedback pass. It keeps repository state, discussion, and source inspection pinned to one PR base and head.

1. **Capture the head.** Use field-limited `gh pr view` to record the base repository, base branch, `baseRefOid`, and `headRefOid`. Treat those SHAs as the review boundary; do not infer them from the current local branch or `FETCH_HEAD`.
2. **Establish scope.** Use `gh pr diff --name-only` to find changed files. Fetch both captured OIDs into explicit local refs, verify that each ref resolves to its recorded OID, and use local Git to read the relevant base-to-head file diffs and full source. Do not inspect mutable branch names, and do not rely on `FETCH_HEAD`, which another fetch can replace.
3. **Add remote review state only when needed.** Use the GitHub connector for merged discussion and review threads with resolved state, which `gh` does not expose cleanly in one small request. Otherwise, prefer `gh` subcommands and field-limited output. Use `gh api` only when neither path supplies the needed read.
4. **Check CI separately.** Use `gh pr checks` for a concise check summary. For a relevant failure, use `gh run view --log-failed` on that run. Do not retrieve a complete check rollup merely to identify a failing job.
5. **Confirm freshness.** Re-read field-limited PR metadata immediately before forming conclusions. If either `baseRefOid` or `headRefOid` changed, the snapshot is stale: repeat these steps and review only the new snapshot.

The CLI-first path is the default because its commands and fields are discoverable, and narrow queries minimize tokens. Use the GitHub connector as the targeted exception for resolved review state, merged discussion, or a CLI authentication/capability gap.
