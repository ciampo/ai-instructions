---
name: review-blast-radius
description: Review a change read-only for indirect breakage beyond the diff by tracing consumers, lifecycle timing, dependency behavior, serialized contracts, and downstream systems, then prove the safety-critical assumption with the strongest cheap executable check. Use directly for blast-radius, what-could-this-break, or distrusted-small-diff requests. General PR reviews start with review-pr, which may delegate this specialist. Do not use for implementation or generic test-quality review. Never edit source, commit, or write remotely.
---

# Review Blast Radius

Find indirect breakage that a diff and direct symbol search can miss. Reduce the
review to the small number of facts that make the change safe, then test those
facts instead of relying on a convincing explanation.

## Authority and scope

- Keep the review read-only. Inspect the pinned change, full modified source,
  callers, downstream consumers, pinned dependencies, local patches, generated
  artifacts, persisted data, and wire formats that are in scope.
- You may run existing checks or create a disposable probe in the OS temporary
  directory. Do not change tracked or untracked repository files, product data,
  external systems, commit history, or remote state.
- Inspect a probe and every changed or third-party code path before executing it.
  Keep execution sandboxed and offline unless the user separately authorizes
  access to credentials, services, networks, or non-test data.
- If the user prohibits all local writes, do not create a probe file. Use an
  existing check or an inline command when safe; otherwise mark executable proof
  unavailable.
- Do not turn missing runtime access or an unproven possibility into a finding.
- Use `review-compatibility` when the primary question is a supported-version,
  upgrade, migration, or persisted-contract guarantee. Use `review-test-quality`
  when the primary question is whether existing tests prove observable behavior.

## Review method

1. **State the changed behavior**: Describe what now happens differently,
   including lifecycle, timing, ownership, serialization, or dependency behavior
   that is not obvious from the diff.
2. **Find the safety hinge**: Name the one or two factual assumptions on which
   the change's safety depends. Prefer a narrow falsifiable statement, such as
   "the deferred cleanup cannot delete a replacement entry."
3. **Trace beyond direct callers**: Follow the value or effect across callbacks,
   queues, teardown, caches, configuration, generated code, storage, API
   responses, database columns, wire formats, language boundaries, feature
   flags, and downstream integrations. Inspect the exact installed dependency
   source and local patches when its semantics form part of the hinge.
4. **Walk the failure path**: Establish the required preconditions, whether the
   path is reachable, the affected scope, and the concrete result. A search that
   finds no consumer is evidence only for the searched boundary.
5. **Prove each hinge as far as practical**:
   - cite the exact source or dependency implementation;
   - show why the failure path cannot reach the changed behavior;
   - run a focused test or disposable probe against the real code;
   - reproduce the behavior in the running application when cheap and safe.
   Record the strongest completed level and the observed result. If executable
   proof is practical but unavailable, mark the hinge unproven.
6. **Separate outcomes**: Retain only confirmed risks with evidence, likelihood,
   and impact. List material paths that were checked and cleared separately.
   Keep unknown consumers, unavailable environments, and unsupported safety
   hinges under verification gaps.

## Output contract

When `review-pr` or `review-coordinator` invokes this skill, return an internal
handoff with the immutable scope checked, changed behavior, each safety hinge,
its strongest proof and observed result, confirmed candidate findings, cleared
risks, verification gaps, and an explicit no-findings result when applicable.
Do not create a separate review artifact.

For direct use, `chat only` and `no artifact` select chat delivery. `do not write
files` and `do not modify files` prohibit every local file write and also require
chat delivery. Otherwise, write one portable Markdown artifact in the OS
temporary directory. For each retained risk, give the exact location when
available, failure path, likelihood, impact, and cheapest pre-merge check.
Include the command or probe and its observed result when executable proof was
run. Do not paste a long consumer inventory or speculative risk catalogue.

## Completion criteria

- The changed behavior and safety-critical assumptions are explicit.
- Indirect consumers and cross-boundary effects were checked beyond direct symbol
  references.
- Each retained risk has a reachable failure path and concrete impact.
- Each safety hinge has the strongest practical proof level and observed result,
  or is clearly marked unproven.
- Source and remote state remain unchanged.
