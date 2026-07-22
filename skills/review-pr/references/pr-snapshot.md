# Pull-Request Snapshot Procedure

Use this procedure before a remote PR review, self-review, or feedback pass. It keeps repository state, discussion, and source inspection pinned to one PR head.

1. **Capture the head.** Make one connector PR-info call and record the base repository, base branch, `base_sha`, and `head_sha`. Treat those SHAs as the review boundary; do not infer them from the current local branch or `FETCH_HEAD`.
2. **Collect review state in parallel.** With the captured PR, fetch changed filenames, merged discussion, and review threads with resolved state. Fetch patches only for files that are relevant to the review question. The connector is the default for this data; it avoids stitching REST comments, reviews, and resolution state together.
3. **Inspect the captured source.** Read remote repository files at `head_sha`, or resolve that exact commit to an explicit local ref before using local tooling. Verify the ref resolves to `head_sha`. Do not inspect a mutable branch name, and do not rely on `FETCH_HEAD`, which another fetch can replace.
4. **Check CI separately.** Use `gh pr checks` for a concise check summary. For a relevant failure, use `gh run view --log-failed` on that run. Do not retrieve a complete check rollup merely to identify a failing job.
5. **Confirm freshness.** Re-read connector PR info immediately before forming conclusions. If `head_sha` changed, the snapshot is stale: repeat these steps and review only the new snapshot.

The GitHub connector is preferred because a local CLI token can be stale even when selected read-only `gh` commands work. Use `gh` as a fallback for missing connector capability, current-branch discovery, publishing, and CI logs.
