# Core Review and Delivery Reference

## Core review

- Read the full merge-base diff, every modified source file, and relevant consumers before forming findings.
- Cover accessibility, consistency, simplicity, API correctness, test adequacy, blast radius, build and dependency correctness, documentation, and scope. Always complete the `review-simplicity` baseline before selecting additional specialist lanes.
- Treat specialist findings as inputs: verify and deduplicate them before delivery.
- Use `[critical]`, `[major]`, `[minor]`, and `[nit]` only for confirmed evidence-backed findings. Material uncertainty belongs in verification gaps.

## Severity Normalization Contract

Normalize every confirmed finding by concrete impact, affected scope, reachability or likelihood, and recovery or reversibility. The same evidence must receive the same severity regardless of whether the core review, a direct specialist, or the coordinator found it. Treat specialist labels as candidate input, not authority.

- **[critical]** — Must block merge because a reachable failure causes severe or hard-to-recover harm. Examples include an authorization bypass that permits destructive cross-account actions, sensitive-data exposure, unrecoverable data loss, or a broadly blocked core path.
- **[major]** — Must block merge because the issue materially breaks correctness, accessibility, compatibility, or a supported user or consumer workflow without reaching critical impact. This includes losing persisted user state during a supported upgrade.
- **[minor]** — Non-blocking, limited, and recoverable impact, or a narrow maintainability, documentation, or test gap that does not establish a material behavior regression.
- **[nit]** — Optional style or polish with no behavioral or contract impact.

Missing evidence is a verification gap, not a reason to lower a confirmed finding's severity. After deduplication, normalize from the retained evidence again instead of preserving the loudest, quietest, or majority label.

## Delivery

- Use portable Markdown with numbered, concise findings. Do not repeat them in a summary.
- Give inline findings exact file paths and line ranges as artifact metadata when available; do not invent locations or repeat them in the suggested comment.
- Draft each suggested GitHub comment as one or two short, natural sentences with the concern and requested change or question. Add impact only when it is not obvious. Put optional evidence or technical explanation in `<details>`.
- Do not post to GitHub unless explicitly asked.
- Keep the final review to one response. Do not expose panel transcripts, vote counts, or competing specialist reports.
