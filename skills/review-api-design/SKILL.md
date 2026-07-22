---
name: review-api-design
description: Perform a read-only review of a public component, library, or package API for minimality, consistency, type safety, consumer ergonomics, and safe evolution. Use when the user explicitly requests API-design review of exports, types, props, callbacks, composition, or compatibility. Do not use for general PR review, internal implementation review, or API implementation; never edit source, commit, or write remotely.
---

# Review API Design

Review the public contract from the consumer's perspective and report only material design risks or improvements supported by real repository patterns and consumers.

## Authority and scope

- Keep the review read-only. Inspect source, types, tests, documentation, consumers, sibling APIs, and upstream contracts as needed.
- Do not modify source or generated files, commit, push, post comments, or update pull-request metadata.
- Treat the target repository's compatibility and versioning policy as authoritative. Do not impose one library's preferred API shape on another.

## Review method

1. **Define the public surface**: Inventory the exports, types, props, callbacks, return values, composition points, defaults, and documented behaviors actually in scope.
2. **Find real consumers and precedents**: Inspect call sites, sibling APIs, package conventions, and upstream primitives before judging the surface in isolation.
3. **Test necessity and minimality**: Identify members without a concrete consumer, redundant ways to express the same behavior, accidental implementation leakage, or abstractions added only for hypothetical future needs.
4. **Evaluate correctness and type safety**: Check whether valid states are easy to express, invalid states are prevented where practical, defaults match runtime behavior, refs and polymorphism are precise, and callbacks expose the information consumers need without oversharing internals.
5. **Evaluate consistency by semantics**: Align names, callback shapes, composition, and return types when sibling semantics match. Do not force symmetry that exposes an invalid state or contradicts the underlying platform or primitive.
6. **Assess evolution from current evidence**: Identify concrete compatibility traps, required-versus-optional mistakes, and difficult-to-reverse decisions. Do not add escape hatches or extension points without a current use case.
7. **Investigate uncertainty privately**: Resolve questions through installed types, source, consumers, tests, and current official documentation. Report an unresolved possible issue only when the risk is material and the author is better positioned to verify it.
8. **Recommend the smallest coherent alternative**: Explain the consumer impact, the established pattern, and a focused design direction without implementing it.

## Output contract

When `review-pr` invokes this skill for its own review, return the scoped findings and verification gaps to that workflow as an internal handoff. Do not create a Markdown artifact or return a user-facing path; `review-pr` owns the single synthesized deliverable.

For multiple findings, write one portable Markdown artifact in the OS temporary directory and return its path. Use chat snippets only when explicitly requested.

Start with a short surface assessment, then order findings by `[critical]`, `[major]`, `[minor]`, or `[nit]` based on concrete consumer impact and likelihood. Each finding must include the affected public member, evidence from consumers or established contracts, the compatibility or usability consequence, and a concise alternative. Use exact lines only for inline findings; do not invent a location for a package-level concern.

No findings is a valid result. Record material verification gaps separately from findings, and do not pad the review with speculative future-proofing or style preferences.

## Completion criteria

- The full scoped public surface and meaningful consumers were inspected.
- Sibling and upstream comparisons account for semantic differences.
- Findings describe concrete consumer or compatibility impact.
- Source and remote state remain unchanged.
