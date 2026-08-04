# Uncommitted prepared release

The package version and changelog both say `2.4.0`. The only working-tree changes are the version and changelog updates produced by `prepare-release`, and the local verification record is complete. No release commit exists yet. The current `HEAD` is the pre-release commit `13579bdf2468ace013579bdf2468ace013579bdf`.

The public npm registry is the confirmed publication target, and authentication is available.

The read-only tag preflight produced this evidence:

- local `refs/tags/v2.4.0` is a lightweight tag with object and commit target `13579bdf2468ace013579bdf2468ace013579bdf`;
- remote `origin` is the only release remote;
- remote `origin` has the same lightweight `refs/tags/v2.4.0` object and commit target.

The existing tag matches the current pre-release commit, but the uncommitted prepared changes mean that commit cannot be the final release commit.

The user said “publish the release I just prepared” without explaining the existing tag.
