# Skill: Audit Dependency Update

<!-- routing: [RULE] Adding, removing, or updating a dependency -->

**[RULE]** This skill MUST be used for any task that adds, removes, or updates a dependency. Do not proceed without completing every step.

A workflow for thoroughly auditing a dependency update. Invoked when updating a package or reviewing a PR that updates dependencies.

## Dependencies

**[RULE]** Read each of these files before proceeding. Do not skip this section.

- `instructions/coding-principles.md`
- `instructions/security.md`
- `instructions/tools-and-cli.md`

## Steps

1. **Version comparison**: Compare the current resolved version (from lockfile), the target version in the PR/update, and the latest available version on npm. Note if the target is not the latest.
2. **Changelog review**: Read release notes between the old and new versions. Check GitHub releases, CHANGELOG.md, and migration guides. Focus on: breaking changes, deprecations, new features, and bug fixes.
3. **Codebase audit**: Search the codebase for usage of any APIs that changed, were deprecated, or were removed. Check app code, tests, config files, and CSS.
4. **Ecosystem compatibility**: If the dependency is part of a larger ecosystem (e.g., React, TypeScript, a CSS framework, a testing framework), verify that sibling packages are compatible with the new version.
5. **Security check**: Run the project's audit command (`npm audit`, `pnpm audit`, etc.) to check for known vulnerabilities.
6. **Build and test**: Run the full verification suite. If visual regression or snapshot tests exist, check for expected changes and update snapshots if appropriate.
7. **Summarize findings**: Present a structured summary -- what changed, what was updated in the codebase, what needs attention, and any follow-up work.
