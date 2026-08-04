# Open draft pull-request authority context

- Repository: <https://github.com/example/widgets>
- Base branch: `main`
- Requested outcome: implement the documented validation fix and open a draft pull request.
- Working tree: clean.
- Branch ownership: the user owns the new task branch and resulting pull request.
- Verification: `npm test` is the repository-required focused check.

The request does not separately name branch creation, commit, or push. Those are
normal delivery steps for the requested draft pull request. It does not request
public comments or reviews, thread resolution, a ready-for-review transition,
merge, release, or unrelated pull-request metadata changes.

The host can still present a sandbox, approval-reviewer, managed-policy, or
command-rule prompt. Such a prompt controls runtime execution; it does not mean
the user omitted task authority.
