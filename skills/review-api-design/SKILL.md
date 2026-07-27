---
name: review-api-design
description: Perform a read-only review of a public component, library, or package API for minimality, consistency, type safety, consumer ergonomics, and safe evolution. Use when the user explicitly requests API-design review of exports, types, props, callbacks, composition, or public-contract compatibility; use review-compatibility for supported-version, upgrade, migration, or persisted-state behavior. Do not use as a standalone general PR review, internal implementation review, or API implementation; `review-pr` may invoke this skill as a targeted specialist pass. Never edit source, commit, or write remotely.
---

# Review API Design

Review the public contract from the consumer's perspective and report only material design risks or improvements supported by real repository patterns and consumers.

## Authority and scope

- Keep the review read-only. Inspect source, types, tests, documentation, consumers, sibling APIs, and upstream contracts as needed.
- Do not modify source or generated files, commit, push, post comments, or update pull-request metadata.
- Treat the target repository's compatibility and versioning policy as authoritative. Do not impose one library's preferred API shape on another.
- When the supplied context lacks an exported surface, types, meaningful consumers, sibling contracts, or compatibility policy, identify that absence before evaluating it. An isolated use site is not evidence of the API contract it consumes.

## Review method

1. **Inventory the evidence and surface**: List the supplied exports, types, props, callbacks, return values, composition points, defaults, documented behaviors, consumers, sibling contracts, and compatibility policy. Name material evidence that is absent.
2. **Gate severity findings**: Do not infer a public contract from an isolated use site, implementation fragment, or requested API shape. A severity finding needs an affected public member and source-backed evidence of its consumer or contract consequence. A direct contradiction in supplied types, documentation, or runtime behavior can still be a finding; state any missing context that limits it.
3. **Find real consumers and precedents**: Inspect call sites, sibling APIs, package conventions, and upstream primitives before judging the surface in isolation.
4. **Test necessity and minimality**: Identify members without a concrete consumer, redundant ways to express the same behavior, accidental implementation leakage, or abstractions added only for hypothetical future needs.
5. **Evaluate correctness and type safety**: Check whether valid states are easy to express, invalid states are prevented where practical, defaults match runtime behavior, refs and polymorphism are precise, and callbacks expose the information consumers need without oversharing internals.
6. **Evaluate consistency by semantics**: Align names, callback shapes, composition, and return types when sibling semantics match. Do not force symmetry that exposes an invalid state or contradicts the underlying platform or primitive.
7. **Assess evolution from current evidence**: Identify concrete compatibility traps, required-versus-optional mistakes, and difficult-to-reverse decisions. Missing compatibility policy is a verification gap unless supplied evidence establishes a break. Do not add escape hatches or extension points without a current use case.
8. **Investigate uncertainty privately**: Resolve questions through installed types, source, consumers, tests, and current official documentation. If the required evidence is unavailable, report the exact verification gap rather than a severity-rated risk.
9. **Recommend the smallest coherent alternative**: Explain the consumer impact, the established pattern, and a focused design direction without implementing it.

## Output contract

When `review-pr` or `review-coordinator` invokes this skill as an internal specialist pass, return the scoped findings and verification gaps to that workflow as an internal handoff. Do not create a Markdown artifact or return a user-facing path; the invoking workflow owns the single synthesized deliverable.

For multiple findings, write one portable Markdown artifact in the OS temporary directory and return its path. Use chat snippets only when explicitly requested.

Start with a short evidence and surface assessment, including material missing evidence. Then order findings by `[critical]`, `[major]`, `[minor]`, or `[nit]` based on concrete consumer impact and likelihood. Each finding must include the affected public member, evidence from consumers or established contracts, the compatibility or usability consequence, and a concise alternative. Use exact lines only for inline findings; do not invent a location for a package-level concern.

No findings is a valid result. Record material verification gaps separately from findings. Missing exported API evidence, types, consumers, sibling contracts, compatibility policy, or runtime evidence must remain verification gaps unless the available evidence establishes a concrete public-contract failure; do not promote them to a severity finding or pad the review with speculative future-proofing or style preferences.

## Completion criteria

- The full scoped public surface and meaningful consumers were inspected, or their absence is recorded as a verification gap.
- Available sibling and upstream comparisons account for semantic differences; unavailable comparisons are recorded as verification gaps.
- Findings describe concrete consumer or compatibility impact.
- Source and remote state remain unchanged.
