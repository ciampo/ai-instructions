---
name: review-performance
description: Review a component, feature, package, or UI change read-only for evidence-based bundle, loading, rendering, layout, paint, and scale risks. Use directly for explicit performance, profiling, bundle, or runtime-risk requests. Do not use for general PR review or optimization implementation; review-pr may invoke it as a specialist. Never edit source, commit, or write remotely.
---

# Review Performance

Identify costs that can materially affect users in the scoped execution context, without turning unmeasured micro-optimizations into findings.

## Authority and scope

- Keep the review read-only. Inspect source, consumers, production build output, profiles, benchmarks, dependency metadata, and existing tests as needed.
- Do not modify source, snapshots, build configuration, dependencies, or generated artifacts. Do not commit, push, post comments, or update pull-request metadata.
- A local measurement artifact or Markdown review is allowed when it is part of the requested analysis and does not alter repository source.
- Source code can identify a candidate path to measure, but it cannot establish user impact, severity, a latency range, or an optimization. Treat absent scale, profile, budget, and consumer evidence as explicit verification gaps.

## Review method

1. **Inventory the evidence and path**: Identify the supplied execution path, invocation frequency, realistic data sizes and instance counts, target devices, and applicable latency, responsiveness, memory, or bundle budgets. Label absent inputs as unknown rather than supplying typical values.
2. **Gate severity findings**: Require a measured cost from the supplied execution scenario and an observed breach of an explicit supplied performance contract before assigning a severity. Otherwise report candidate costs only as verification gaps. Do not assign a severity, estimate a latency range, or prescribe an optimization from source inspection alone.
3. **Establish available evidence**: Prefer existing profiles, bundle reports, benchmarks, production build output, and reproducible traces. When measurement is unavailable, use source inspection to identify what needs profiling and state the smallest repeatable measurement that would decide it.
4. **Inspect loading and bundle impact**: Trace new dependencies and entrypoints, duplicated code, side-effect metadata, code-splitting boundaries, media, and work moved onto critical startup paths.
5. **Inspect runtime work**: Look for repeated expensive computation, unnecessary subscriptions or effects, avoidable renders in hot paths, unbounded collections, memory retention, main-thread blocking, and work whose cost grows poorly at realistic scale.
6. **Inspect layout and paint behavior**: Check forced synchronous layout, read/write interleaving, large invalidation regions, expensive visual effects, layout shifts, and animations that create meaningful rendering cost in the target browsers.
7. **Trace consumers and scale**: A pattern that is harmless once may matter in a repeated list or interactive loop. Confirm the actual fan-out instead of assuming a benchmark size.
8. **Measure before prescribing**: Use the repository's existing tools and comparable before/after conditions. Do not recommend memoization, virtualization, lazy loading, containment, or a new dependency without evidence that it addresses the identified bottleneck and does not create a larger trade-off.
9. **Recommend the next verifiable direction**: For a confirmed bottleneck, state the cost, affected scenario, evidence, smallest plausible improvement, and the measurement that would confirm it without implementing the change. Otherwise, state only the missing measurement or performance contract needed to decide; do not prescribe an optimization.

## Output contract

When `review-pr` or `review-coordinator` invokes this skill as an internal specialist pass, return the scoped findings and verification gaps to that workflow as an internal handoff. Do not create a Markdown artifact or return a user-facing path; the invoking workflow owns the single synthesized deliverable.

For direct use, `chat only` and `no artifact` select chat delivery. `do not write files` and `do not modify files` prohibit every local file write and also require chat delivery. In either chat mode, return the findings in chat and do not create or open a local file. Otherwise, write multiple findings to one portable Markdown artifact in the OS temporary directory and return its path.

Start with the reviewed path, supplied scale, available measurements, and material unknowns. Order findings by `[critical]`, `[major]`, `[minor]`, or `[nit]` based on the observed contract breach in the affected scenario and likelihood. Each finding must connect code to a measured cost in the supplied execution scenario and an observed breach of an explicit supplied performance contract, plus a focused alternative and a repeatable verification method. Put unmeasured or contract-free hypotheses under verification gaps rather than presenting them as confirmed regressions.

No findings is a valid result. Unmeasured costs remain hypotheses and receive no severity-rated finding. Do not report generic best practices or micro-optimizations without a plausible, scoped impact.

## Completion criteria

- The relevant execution path, consumers, and realistic scale were inspected, or unavailable consumer or scale evidence is recorded as a verification gap.
- Confirmed findings are backed by a measured cost in the supplied realistic execution scenario and an observed breach of an explicit supplied performance contract; unmeasured or contract-free costs remain hypotheses.
- Measurement gaps and assumptions are explicit.
- Source and remote state remain unchanged.
