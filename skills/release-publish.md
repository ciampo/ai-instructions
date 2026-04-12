# Skill: Release / Publish

A workflow for preparing and publishing a package release. Invoked when I say "prepare a release", "publish the package", "cut a release", or "bump the version."

## Dependencies

Load these instruction files before executing this skill:

- `instructions/writing-conventions.md`
- `instructions/tools-and-cli.md`

## Steps

1. **Review unreleased changes**: Read the CHANGELOG (unreleased section), commit log since last tag, and any open PRs targeting the release branch. Understand the full scope of what is being released.
2. **Determine version bump**: Based on the changes, recommend a semver bump:
   - **patch**: Bug fixes, internal refactors, documentation.
   - **minor**: New features, non-breaking API additions, enhancements.
   - **major**: Breaking changes, removed APIs, incompatible behavior changes.
   - Present the recommendation with reasoning. Wait for confirmation.
3. **Update version**: Bump the version in `package.json` (and any other version files the project uses). Update the lockfile if needed.
4. **Finalize CHANGELOG**: Move unreleased entries under the new version heading. Add the release date. Ensure all entries have PR links and correct categories.
5. **Verify**: Run the full verification suite (lint, type-check, build, tests). The release must be clean.
6. **Commit and tag**: Create a commit with the version bump and CHANGELOG. Tag it with the version (`vX.Y.Z`). Push the commit and tag.
7. **Publish**: Run the project's publish command (`npm publish`, `pnpm publish`, etc.). If the project uses a CI-based publish pipeline, trigger it instead.
8. **Post-publish verification**: After publishing, verify the package is available on the registry with the correct version, files, and exports.
9. **GitHub release**: If the project uses GitHub releases, create one from the tag with the CHANGELOG entries as the body (use `gh release create`).
10. **Communicate**: Note any follow-up work: announcements, downstream dependency updates, migration guides for consumers.
