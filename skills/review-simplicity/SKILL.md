---
name: review-simplicity
description: Perform a read-only, deletion-first review of an existing implementation or proposed change for unnecessary code, state, branches, indirection, dependencies, duplication, and speculative abstraction while preserving required behavior and contracts. Always use as a baseline pass within `review-pr`, `review-coordinator`, and `self-review-pr`, even when simplification was not explicitly requested; also use for direct code-bloat, overengineering, code-removal, or complexity review. Do not use when the user asks to implement the simplification. Never edit source, commit, or write remotely.
---

# Review Simplicity

Find the smallest coherent way to achieve the required outcome. Prefer deleting or consolidating code over adding another layer, but optimize for fewer concepts and obligations rather than raw line count.

## Authority and scope

- Keep the review read-only. Inspect the scoped change, its baseline, consumers, sibling patterns, dependencies, tests, and repository contracts.
- Preserve required behavior, public APIs, compatibility, accessibility, security, performance, and support policy. Do not assume a requirement can be dropped; present that as a product decision when evidence is missing.
- Do not modify source, tests, generated files, dependencies, commit history, or remote state.

## Review method

1. **Define the outcome and invariants**: State what must remain observably true and which repository or consumer contracts constrain the solution.
2. **Challenge the premise**: Ask whether the change is needed at all, whether an existing repository or platform capability already provides it, and whether a narrower requirement removes the need for general machinery.
3. **Account for every added concept**: Trace new state, effects, flags, branches, wrappers, helpers, types, configuration, dependencies, and compatibility paths to a demonstrated requirement. Treat unsupported generality as a deletion candidate.
4. **Search outside the diff**: Inspect sibling implementations and consumers for an existing primitive or direct path that can replace duplicated logic without expanding another public API.
5. **Construct the deletion-first alternative**: Prefer removing dead or duplicated code, deriving values instead of synchronizing state, using an existing supported primitive, inlining a single-use abstraction, or narrowing scope. Do not move the same complexity behind a new helper or dependency.
6. **Prove parity**: Identify the exact files, symbols, branches, or dependencies that can disappear and show how the remaining path preserves each invariant. Use existing tests and consumers; record missing runtime or contract evidence as a verification gap.
7. **Report only material simplifications**: Retain a finding when the current structure creates a concrete correctness, maintenance, dependency, or comprehension cost and a smaller evidenced path exists. Keep aesthetic alternatives and speculative rewrites out of the findings.

## Output contract

When `review-pr`, `review-coordinator`, or `self-review-pr` invokes this mandatory baseline skill, return an internal handoff with the scope checked, required invariants, confirmed deletion opportunities, verification gaps, and an explicit no-findings result when applicable. Do not create a separate review artifact.

For direct use, write one portable Markdown artifact in the OS temporary directory unless chat delivery is explicitly requested. For each finding, describe the unnecessary machinery, its concrete cost, the smaller alternative, what can be removed, and the evidence that required behavior remains intact. Use `[critical]`, `[major]`, `[minor]`, or `[nit]` only when the impact supports that severity.

Prefer one strong simplification over a catalogue of optional refactors. No findings is valid when the existing approach is the smallest clear implementation supported by the evidence.

## Completion criteria

- The required outcome and contracts are explicit.
- Existing primitives, sibling patterns, and consumers were checked before proposing new structure.
- Each retained opportunity removes or consolidates concrete machinery without merely relocating complexity.
- Unproven requirement changes or parity claims remain verification gaps.
- Source and remote state remain unchanged.
