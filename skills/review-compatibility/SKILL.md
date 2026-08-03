---
name: review-compatibility
description: Perform a read-only compatibility review of a change that can affect supported versions, upgrades, persisted data, wire formats, configuration, integrations, or migration paths. Use for backward-compatibility, deprecation, upgrade, rollout, migration, schema, or cross-version review; use review-api-design for the public API shape itself. Never edit source, commit, or write remotely.
---

# Review Compatibility

Review whether a supported pre-change state can safely reach, use, and leave the changed state. Keep public-API shape review in `review-api-design`; this skill covers behavior across versions and states.

## Authority and scope

- Keep the review read-only. Inspect the pinned change, versioning policy, migration and release notes, persisted formats, integration contracts, tests, and representative consumers as needed.
- Do not invent supported versions, migration guarantees, data shapes, or rollout requirements. Treat missing policy or historical state as a verification gap.
- Do not modify source, generated files, data, release metadata, commit history, or remote state.

## Review method

1. **Define the supported boundary**: Identify the repository's version, deprecation, upgrade, and rollback policy, plus the concrete old states and external contracts the change claims to support.
2. **Trace state transitions**: Compare old and new readers, writers, defaults, validation, feature flags, stored data, configuration, URLs, wire formats, and integration points.
3. **Check upgrade and rollback safety**: Look for one-way migrations, incompatible defaults, data loss, mixed-version behavior, failed retries, and recovery paths that are unsupported or untested.
4. **Inspect real evidence**: Use migrations, fixtures, compatibility tests, release notes, consumers, and supported-version CI rather than inferring a break from a renamed symbol alone.
5. **Separate API and compatibility concerns**: Hand public-contract ergonomics, exports, types, and callback design to `review-api-design`. Keep a finding here only when a supported old/new state demonstrably fails to interoperate or upgrade.
6. **Recommend the narrowest safe change**: State the affected supported state, transition, consequence, evidence, and a verifiable correction or test.

## Output contract

When `review-pr` or `review-coordinator` invokes this skill, return an internal handoff with confirmed findings, verification gaps, and an explicit no-findings result when applicable. Do not create a separate review artifact.

For direct use, `chat only` and `no artifact` select chat delivery. `do not write files` and `do not modify files` prohibit every local file write and also require chat delivery. In either chat mode, return the findings in chat and do not create or open a local file. Otherwise, write one portable Markdown artifact in the OS temporary directory. Confirmed findings use `[critical]`, `[major]`, `[minor]`, or `[nit]` only when a supported boundary and incompatible behavior are evidenced. Missing historical data, policy, or upgrade coverage is a verification gap, not a severity finding.

## Completion criteria

- Supported versions and states come from repository evidence.
- Each confirmed finding identifies a concrete transition and user, data, or integration consequence.
- Public-API design concerns are not duplicated.
- Source and remote state remain unchanged.
