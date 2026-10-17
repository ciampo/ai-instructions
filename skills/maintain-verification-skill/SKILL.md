---
name: maintain-verification-skill
description: Check and maintain an existing project-local verification skill and feature map against source and live behavior. Use when asked to maintain the skill or audit its recipes, not for ordinary test runs, test-quality reviews, or product bug fixes.
---

# Maintain a verification skill

Check whether the project's verification instructions still describe and exercise its real user or consumer workflows. Cover the map from source and live execution, and distinguish instruction drift from product regressions.

## Authority and scope

- A maintenance request authorizes local corrections within the target verification skill's directory, including its feature map and owned helpers. An audit-only request stays read-only and reports proposed corrections. Isolate experimental state outside the user's checkout.
- Never edit product code or change expected behavior to conceal a regression. A broken feature is a product gap to report separately.
- Do not commit, push, open a pull request, or schedule future runs unless the user's existing instructions authorize that delivery. Under an authorized PR workflow, group proven verification corrections into one draft PR.
- Use disposable instances and test data. Do not drive a user's active session or make external writes without existing authorization. Honor narrower limits even if the target skill says otherwise.

## Locate and inspect

Find the user-selected project-local skill, or inspect the project's native skill locations for one with launch, drive, and feature-map instructions. Do not assume a vendor path. Ask which target when several plausible candidates remain. If none exists, stop and suggest `create-verification-skill`; do not invent a target.

Read the skill, feature index, and sibling feature files. Check for missing, duplicate, extra, or dead index entries. Preserve unrelated user-maintained content. Inspect recent source changes for omitted user-facing features, requiring a concrete source path before calling one missing.

## Check the source

For every mapped feature, identify its public entry points, prerequisites, current behavior, likely instruction drift, and a concise live verification recipe. Cite source locations for corrections.

Use read-only subagents for independent source checks when available, authorized, and useful. Bound concurrency to the host's limits and batch features when needed. Each child returns the feature summary, source entry points, likely drift or none, and a recipe. Children never drive the application or edit files. Without delegation, perform the same checks serially; coverage requirements do not change.

Recheck suspected drift before editing. Combine overlapping recipes into as few application states as practical without losing feature or entry-point coverage.

## Run the live pass

Live execution is required even when source looks consistent. One driver owns all interactions. Follow the target skill's launch model: a serially driven instance for a server or UI, or a fresh isolated context for each short-lived CLI or library recipe.

- Run the doctor checks before driving a new instance or isolated recipe context, and after any failed drive. Commands in one recipe can share a checked build and data context; doctor commands need no recursive preflight. If a UI is stuck despite a healthy process, reset to a known state or relaunch the owned instance.
- Exercise every mapped feature and its documented entry points and behavior claims. Record any unexecuted paths explicitly; one convenient entry point does not prove the others.
- Capture actions, results, and relevant side effects. Verify evidence remains at its named location after every cleanup. Keep concise coverage notes in scratch storage, not the source tree.
- Clean failed attempts and unused processes or scratch state. For shared instances, remove only residue owned by the run. Never kill by process name or remove someone else's data.
- A doctor failure caused by instruction drift can receive one proven correction and retry when local edits are authorized. Restart only what the correction invalidates. Otherwise report the blocker.
- Record unreachable paths with the attempted route and concrete missing prerequisite, such as authentication, entitlement, operating system, or external state. A missing documented prerequisite is drift. An unreachable path is not a passing proof.

## Reconcile and finish

Classify each discrepancy before changing anything:

- Outdated descriptions, commands, or prerequisites are instruction drift. Apply corrections only within the authorized scope.
- Working behavior that the harness cannot exercise is a harness gap. Repair only helpers owned by the verification skill, document their invocation, and re-drive the affected paths.
- Broken product behavior is a product gap. Preserve the intended contract and report the regression separately; do not rewrite the map to accept it.

Execute corrected recipes again and inspect their evidence before calling corrections proven. Read every changed file. Run final cleanup after the last proof and verify the evidence survives. If a run fails partway through, preserve completed evidence and report the remaining coverage.

Report the outcome and coverage concisely:

- `clean`: all mapped behavior received source and live coverage, with no drift or product gaps. No edits or PR needed.
- `changed`: authorized local corrections were applied and proved, all mapped behavior received coverage, and no unresolved product gaps remain. Delivery follows existing authority.
- `drift`: a read-only audit completed source and live coverage and proved instruction or harness discrepancies. Report proposed corrections without applying them.
- `blocked`: coverage or an authorized correction remains incomplete, or a product gap remains unresolved. State the exact blocker, partial coverage, any applied corrections, and proposed next action. Completed audit findings alone are not a blocker.

<!-- Adapted from https://github.com/cursor/plugins/tree/c49b37a2c0e7bede60a71ad7322e3f12c337a3da/pstack/skills/maintain-verification-skill. MIT licensed; see LICENSE. -->
