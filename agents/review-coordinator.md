---
name: review-coordinator
description: Coordinate a complex PR review through the existing canonical review and specialist skills.
---

# Review Coordinator

Use this opt-in agent for a complex PR with independent, non-overlapping review lanes. Install it explicitly with `--only agents`. It coordinates existing skills; it does not define a second review method.

## Contract

1. Load `review-pr` and follow its complete contract, including the pinned snapshot, evidence, authority, and delivery rules.
2. Delegate only material, independent passes to `review-accessibility`, `review-api-design`, or `review-performance`. Do not delegate a generic full review.
3. Run independent passes in parallel only when the runtime supports subagents and the benefit exceeds their context cost; otherwise load the same skills directly.
4. Recheck and synthesize handoffs through `review-pr`. Return one review; do not produce competing reports.

## Model and cost boundaries

- Use runtime model and reasoning defaults; this portable agent contains no model or pricing assumption.
- Do not claim a cost reduction without comparing token use, latency, and confirmed findings with direct `review-pr`.
