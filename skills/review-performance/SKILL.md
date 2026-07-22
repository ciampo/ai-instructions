---
name: review-performance
description: Perform a read-only, evidence-based performance review of a component, feature, package, or UI-focused change for bundle cost, loading, rendering, layout, paint, and scale risks. Use when the user explicitly requests performance review, profiling analysis, or bundle and runtime risk assessment. Do not use as a standalone general PR review or optimization implementation; `review-pr` may invoke this skill as a targeted specialist pass. Never edit source, commit, or write remotely.
---

# Review Performance

Identify costs that can materially affect users in the scoped execution context, without turning unmeasured micro-optimizations into findings.

## Authority and scope

- Keep the review read-only. Inspect source, consumers, production build output, profiles, benchmarks, dependency metadata, and existing tests as needed.
- Do not modify source, snapshots, build configuration, dependencies, or generated artifacts. Do not commit, push, post comments, or update pull-request metadata.
- A local measurement artifact or Markdown review is allowed when it is part of the requested analysis and does not alter repository source.

## Review method

1. **Define the user-critical path**: Identify where and how often the code runs, realistic data sizes and instance counts, target devices, and the latency, responsiveness, memory, or bundle budget that matters.
2. **Establish available evidence**: Prefer existing profiles, bundle reports, benchmarks, production build output, and reproducible traces. When measurement is unavailable, distinguish a source-proven cost from a hypothesis that still needs profiling.
3. **Inspect loading and bundle impact**: Trace new dependencies and entrypoints, duplicated code, side-effect metadata, code-splitting boundaries, media, and work moved onto critical startup paths.
4. **Inspect runtime work**: Look for repeated expensive computation, unnecessary subscriptions or effects, avoidable renders in hot paths, unbounded collections, memory retention, main-thread blocking, and work whose cost grows poorly at realistic scale.
5. **Inspect layout and paint behavior**: Check forced synchronous layout, read/write interleaving, large invalidation regions, expensive visual effects, layout shifts, and animations that create meaningful rendering cost in the target browsers.
6. **Trace consumers and scale**: A pattern that is harmless once may matter in a repeated list or interactive loop. Confirm the actual fan-out instead of assuming a benchmark size.
7. **Measure before prescribing**: Use the repository's existing tools and comparable before/after conditions. Do not recommend memoization, virtualization, lazy loading, containment, or a new dependency without evidence that it addresses the identified bottleneck and does not create a larger trade-off.
8. **Recommend a verifiable direction**: State the cost, affected scenario, evidence, smallest plausible improvement, and the measurement that would confirm it without implementing the change.

## Output contract

When `review-pr` invokes this skill for its own review, return the scoped findings and verification gaps to that workflow as an internal handoff. Do not create a Markdown artifact or return a user-facing path; `review-pr` owns the single synthesized deliverable.

For multiple findings, write one portable Markdown artifact in the OS temporary directory and return its path. Use chat snippets only when explicitly requested.

Start with the reviewed path, assumed scale, and available measurements. Order findings by `[critical]`, `[major]`, `[minor]`, or `[nit]` based on user impact and likelihood. Each finding must connect code to a concrete cost and include evidence, a focused alternative, and a repeatable verification method. Put unmeasured but material hypotheses under verification gaps rather than presenting them as confirmed regressions.

No findings is a valid result. Do not report generic best practices or micro-optimizations without a plausible, scoped impact.

## Completion criteria

- The relevant execution path, consumers, and realistic scale were inspected.
- Confirmed findings are backed by source-proven cost or measurement.
- Measurement gaps and assumptions are explicit.
- Source and remote state remain unchanged.
