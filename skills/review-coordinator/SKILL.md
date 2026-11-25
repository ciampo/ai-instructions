---
name: review-coordinator
description: Compatibility route for the former coordinated-review skill. Use only when an existing prompt names review-coordinator; route the request to review-pr.
---

# Review Coordinator Compatibility

This deprecated skill preserves the former `review-coordinator` name. `review-pr` now selects specialist methods, sizes any delegation, rechecks the evidence, and delivers one review.

## Route the request

1. Load `review-pr` and follow it. Keep every limit in the request, including read-only, chat-only, and no-file limits.
2. When the request supplies a pinned snapshot, a completed core-review result, or a completed simplicity handoff, pass it to `review-pr` and do not repeat that work.
3. Do not produce a separate coordinator report. `review-pr` owns the single final review.

Prefer `review-pr` in new prompts.
