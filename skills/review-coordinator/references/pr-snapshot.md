# Pull-Request Snapshot Procedure

Use this procedure before a remote PR review, self-review, or feedback pass. It pins repository state, discussion, and source inspection to one PR base and head.

1. **Pin the boundary.** Record the canonical repository, base revision, and head revision. Do not infer them from the current local branch or another mutable ref.
2. **Inspect the PR.** Establish the changed-file scope, then inspect the exact merge-base diff and full source for every changed file.
3. **Check previous feedback.** Read review bodies, inline threads and replies, and PR conversation comments through all available pages, including resolved and outdated threads. Record whether this coverage is complete. Check each actionable concern against the pinned code and relevant tests or replies. Record its original link, GitHub state, current assessment, and any remaining change, reply, or verification. An author's "fixed" reply, approval, outdated marker, or resolved flag alone does not prove the concern is addressed. Avoid duplicate new findings, but retain outstanding prior feedback. If discussion or thread state is unavailable, report that specific limit and do not claim nothing remains open.
4. **Check CI separately.** Inspect summaries first and retrieve logs only for relevant failures.
5. **Confirm freshness.** Refresh the revisions and discussion state before concluding. If either revision changed, rebuild the snapshot; otherwise account for new or resolved feedback.
