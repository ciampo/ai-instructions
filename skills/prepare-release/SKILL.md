---
name: prepare-release
description: Prepare a package or application release locally by choosing a version, updating release metadata, and running verification. Use when asked to prepare or cut a release without publishing it.
---

# Prepare Release

This workflow prepares a release without publishing packages, pushing tags, or creating a remote release.

## Steps

1. **Review unreleased changes**: Read the unreleased changelog, commits since the last tag, and relevant open pull requests.
2. **Recommend a version**: Apply the repository's versioning policy. Explain the proposed bump and wait for confirmation when the user did not specify it.
3. **Update release metadata**: Change version files and lockfiles using the repository's package manager.
4. **Finalize the changelog**: Move unreleased entries under the version and date, preserve required links, and document migrations or breaking changes.
5. **Verify artifacts**: Run lint, type checks, builds, tests, and package dry-runs defined by the repository.
6. **Summarize**: Report the prepared version, changed files, verification, and the exact remote actions still requiring authorization.

Do not commit, tag, push, publish, or create a GitHub release unless the user explicitly requests those actions.
