# Pull-Request Snapshot Procedure

Use this procedure before a remote PR review, self-review, or feedback pass. It pins repository state, discussion, and source inspection to one PR base and head.

If repository identity, revisions, and source are verified but some discussion is unavailable, continue with the accessible evidence and label the review partial. Missing discussion alone does not require another evidence route.

Before collecting the snapshot, verify one usable evidence route: a supplied complete immutable snapshot, an exact local checkout, or an authenticated supported pull-request read interface. A self-contained fixture that explicitly declares itself the complete immutable boundary is a supplied snapshot; use it without remote lookup. If no route can provide the canonical repository, base revision, head revision, and review evidence, stop after that capability check and request the missing snapshot. Do not enumerate unrelated local files, try unauthenticated web clients, or retry alternate network routes.

1. **Pin the boundary.** Record the canonical repository, base revision, and head revision. Do not infer them from the current local branch or another mutable ref.
2. **Inspect the PR.** Establish the changed-file scope, then inspect the exact merge-base diff and full source for every changed file.
3. **Check previous feedback.** Read review bodies, inline threads and replies, and PR conversation comments through all available pages, including resolved and outdated threads. Record whether this coverage is complete. Check each actionable concern against the pinned code and relevant tests or replies. Record its original link, GitHub state, current assessment, and any remaining change, reply, or verification. An author's "fixed" reply, approval, outdated marker, or resolved flag alone does not prove the concern is addressed. Avoid duplicate new findings, but retain outstanding prior feedback. If discussion or thread state is unavailable, report that specific limit and do not claim nothing remains open.
4. **Check CI separately.** Inspect summaries first and retrieve logs only for relevant failures.
5. **Confirm freshness.** Refresh the revisions and discussion state before concluding. If either revision changed, rebuild the snapshot; otherwise account for new or resolved feedback.

Prefer the narrowest available interface that can establish each fact.
