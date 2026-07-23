# Pull-Request Snapshot Procedure

Use this procedure before a remote PR review, self-review, or feedback pass. It pins repository state, discussion, and source inspection to one PR base and head.

1. **Pin the boundary.** Use narrow `gh pr view` metadata to record the canonical PR URL, base branch, `baseRefOid`, and `headRefOid`. Derive repository identity from the URL only when it is needed. Do not infer the boundary from the local branch or `FETCH_HEAD`.
2. **Inspect the PR.** Use `gh pr diff --name-only` for initial scope. Fetch both OIDs into explicit refs, verify them, then use the merge-base diff (`base...head`) and full source to inspect every changed file. Do not inspect mutable branch names.
3. **Add only needed remote state.** Prefer field-limited `gh` reads. Use the connector for merged discussion, resolved review threads, or a CLI authentication/capability gap. Use read-only `gh api` only when neither provides the needed state.
4. **Check CI separately.** Use `gh pr checks`; retrieve failed Actions logs only for a relevant failure.
5. **Confirm freshness.** Re-read narrow PR metadata and refresh the remote discussion or thread state used by the review before concluding. If either SHA changed, discard the snapshot and repeat; otherwise account for new or resolved feedback.

The CLI-first path is the default because it is discoverable and narrow; the connector is the targeted exception.
