# Pull-Request Snapshot Procedure

Use this procedure before a remote PR review, self-review, or feedback pass. It pins repository state, discussion, and source inspection to one PR base and head.

Before collecting the snapshot, verify one usable evidence route: an exact local checkout or an authenticated supported pull-request read interface. If neither route can provide the canonical repository, base revision, head revision, and diff, stop after that capability check and request the missing snapshot. Do not enumerate unrelated local files, try unauthenticated web clients, or retry alternate network routes.

1. **Pin the boundary.** Record the canonical repository, base revision, and head revision. Do not infer them from the current local branch or another mutable ref.
2. **Inspect the PR.** Establish the changed-file scope, then inspect the exact merge-base diff and full source for every changed file.
3. **Add only needed remote state.** Use narrow reads and fetch merged discussion or resolved thread state only when it affects the review.
4. **Check CI separately.** Inspect summaries first and retrieve logs only for relevant failures.
5. **Confirm freshness.** Refresh the revisions and discussion state before concluding. If either revision changed, rebuild the snapshot; otherwise account for new or resolved feedback.

Prefer the narrowest available interface that can establish each fact.
