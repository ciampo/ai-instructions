---
name: audit-dependency-update
description: Audit an existing dependency change read-only, or implement a requested dependency addition, removal, or update, by checking releases, compatibility, security, and verification. Use for every dependency change. For a general PR review, enter through review-pr; it invokes this audit when a dependency changes. Do not infer source-edit, snapshot-update, commit, or remote-write authority from an audit request.
---

# Audit Dependency Update

A workflow for thoroughly auditing a dependency update. Invoked when updating a package or reviewing a PR that updates dependencies.

## Authority

When reviewing or auditing an existing update, inspect and report without modifying source, manifests, lockfiles, generated files, or snapshots. When the user asks to implement a dependency change, local package and compatibility edits are in scope, but commits, pushes, pull requests, releases, and publication still require their own authorization.

## Steps

1. **Version comparison**: Compare the current resolved version (from lockfile), the target version in the PR/update, and the latest available version on npm. Note if the target is not the latest.
2. **Changelog review**: Read release notes between the old and new versions. Check GitHub releases, CHANGELOG.md, and migration guides. Focus on: breaking changes, deprecations, new features, and bug fixes.
3. **Codebase audit**: Search the codebase for usage of any APIs that changed, were deprecated, or were removed. Check app code, tests, config files, and CSS.
4. **Ecosystem compatibility**: If the dependency is part of a larger ecosystem (e.g., React, TypeScript, a CSS framework, a testing framework), verify that sibling packages are compatible with the new version.
5. **Security check**: Run the project's audit command (`npm audit`, `pnpm audit`, etc.) to check for known vulnerabilities.
6. **Build and test**: Run the relevant verification suite. Review visual-regression or snapshot deltas when they exist; update them only as part of an explicitly requested implementation.
7. **Summarize findings**: Present what changed, compatibility and security conclusions, verification, whether local files were modified, and any follow-up work. A valid audit may recommend no change.

## Output contract

When `review-pr` or `review-coordinator` invokes this skill, return an internal handoff. Preserve the supplied repository, base revision, head revision, and target audience; include the scope checked, old and target resolved versions, release and compatibility evidence, audit and build results, confirmed findings, verification gaps, and an explicit no-findings result when applicable. Do not create a separate review artifact.

For direct use, present the same evidence in the requested delivery format.
