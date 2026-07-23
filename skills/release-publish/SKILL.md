---
name: release-publish
description: Compatibility route for the former combined release workflow. Use when an existing prompt invokes release-publish; route preparation to prepare-release and explicit publication to publish-release.
---

# Release Workflow Compatibility

This deprecated skill preserves the former `release-publish` trigger while keeping preparation and publication as separate authority boundaries.

If the request is limited to planning, inspection, or reporting, or prohibits file modifications, route it to the plan-only behavior in `prepare-release`. Do not create an auxiliary plan file or any local release artifact.

## Route the request

1. Use the `prepare-release` skill for version selection, changelog updates, local release artifacts, or any request to prepare or cut a release without explicit publication authorization.
2. When the user explicitly asks to prepare and publish a release, use `prepare-release` first, then continue with `publish-release` after preparation succeeds. Carry the original publication authorization forward; stop if the target, credentials, prepared state, or authorization becomes ambiguous.
3. Use the `publish-release` skill directly when the user explicitly asks to publish an already prepared release.
4. If the request is ambiguous, stop after preparation and report the remote actions that still require authorization.

Prefer the replacement skill name in new prompts. Do not combine preparation and publication merely because this compatibility name was invoked.
