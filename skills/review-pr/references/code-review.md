# Code Review Reference

How I review PRs, and how I expect AI to assist with reviews.

## Process

- **[STRONG]** Support additional review rounds when the PR head changes or the user requests follow-up. Do not require multiple passes when one complete pass resolves the scoped review.
- **[RULE]** Read the full diff, all modified source files, and their consumers before forming opinions.
- **[STRONG]** Cross-reference against how other components/modules in the same codebase handle the same problem. Consistency is a first-class concern.
- **[RULE]** Validate claims independently. Do not take PR descriptions at face value. Read the code and verify.
- **[RULE]** Do not take the problem or the chosen approach as given. Assess [the premise and approach](#premise-and-approach) before the detailed review.

## Premise and Approach

Assess the idea before the implementation. A correct line-level review of the wrong change wastes the author's time and makes that change look closer to done.

- **[RULE]** Establish the problem from sources other than the diff: the linked issue, earlier discussion and decisions, related or competing pull requests, and repository conventions. Use what the snapshot supplies. Report a missing source as a limit; do not guess its content.
- Answer these questions in order, and stop at the first one that fails:
  1. **Problem.** Is the problem real, current, and worth solving in this repository? Check whether the reported behavior is intended, already fixed, already covered by an existing capability, or already declined. Consider what no change would cost.
  2. **Fit.** Does the change solve that problem, or only a symptom or a different problem?
  3. **Approach.** Does the behavior belong to this owner and layer? Compare the approach with materially different ones: an existing mechanism, a smaller change, a fix at the cause, and no change. Weigh the constraints and decisions that the discussion records.
- Give one verdict: **sound**, **acceptable with limits**, or **needs rethinking**. An approach with a known limit is acceptable when the limit is stated and the context justifies the compromise. Name the limit, and ask the author to state it when it is missing.
- **[RULE]** Support the verdict with evidence: a contract, a consumer, a recorded decision, or an existing mechanism. A preference between equally valid approaches is not a concern. Do not reopen a decision that the discussion already settled unless new evidence changes it. Do not invent alternatives for a routine change with one established solution.
- **[RULE]** When the verdict is **needs rethinking**, lead the review with that concern and the decision that the author needs to make. Do not continue the line-level review of code that the decision would replace. Keep only findings that survive a change of approach, and findings that show why the approach fails. Say that the detailed review is deferred.
- Otherwise continue with the full review. Recheck the verdict when later evidence contradicts it.

## Severity Normalization Contract

Normalize every confirmed finding by concrete impact, affected scope, reachability or likelihood, and recovery or reversibility. The same evidence must receive the same severity regardless of whether the core review, a specialist method, or a delegated investigation found it. Treat specialist labels as candidate input, not authority.

- **[critical]** — Must block merge because a reachable failure causes severe or hard-to-recover harm. Examples include an authorization bypass that permits destructive cross-account actions, sensitive-data exposure, unrecoverable data loss, or a broadly blocked core path.
- **[major]** — Must block merge because the issue materially breaks correctness, accessibility, compatibility, or a supported user or consumer workflow without reaching critical impact. This includes losing persisted user state during a supported upgrade.
- **[minor]** — Non-blocking, limited, and recoverable impact, or a narrow maintainability, documentation, or test gap that does not establish a material behavior regression.
- **[nit]** — Optional style or polish with no behavioral or contract impact.

Missing evidence is a verification gap, not a reason to lower a confirmed finding's severity. After deduplication, normalize from the retained evidence again instead of preserving the loudest, quietest, or majority label.

## Output Format

- Use the full-review format from `draft-review-comment`: a short overall assessment, previous-feedback status, and numbered actions with clearly marked suggested comments. Never post directly to GitHub unless asked.
- Keep severity and location as compact artifact metadata instead of repeating them in the suggested comment.
- Draft the GitHub comment as one or two short, natural sentences. State the concern and requested change or question. Add impact only when it is not obvious from the concern.
- Put optional evidence or technical explanation in `<details>` only when the author needs it.

## Uncertain Findings

- Investigate suspected issues privately and use available source, consumer, test, and specification evidence before reporting them.
- Report a **"Possible issue"** only when the unresolved risk is material, the uncertainty cannot reasonably be resolved during review, and the author is better positioned to verify it. Do not surface low-impact speculation merely to avoid suppressing a thought.

<details>
<summary>Examples: review comment quality</summary>

Good review comment (actionable and brief):

> Escape closes the dialog without returning focus to its trigger. Could we restore focus after close?

Noisy comment (vague, opinion-based, no impact):

> **[nit]** I would name this variable differently.

Uncertain finding (clear about what remains unknown):

> Could `ref` still be null when this effect first runs? If so, this access needs a guard.

</details>

## Do NOT Flag

To avoid noise, do not raise comments on:

- Pure stylistic preferences that have no functional impact and no existing convention either way.
- Import ordering (unless the project has an explicit sorting config).
- Minor whitespace or formatting differences handled by automated formatters.
- Choices that are clearly intentional and well-reasoned, unless there's an objectively better way of implementing them.

## Review Priorities (in order)

1. **Premise and approach**: Is this the right problem, and does the approach fit it? See [Premise and Approach](#premise-and-approach).
2. **Accessibility**: semantic HTML, accessible names, keyboard behavior, focus management, announcements, contrast, motion, zoom, and pointer targets. Use `review-accessibility` for the deeper method when UI or interaction changes make this domain material.
3. **Consistency**: Does this follow established patterns across sibling modules and the broader codebase?
4. **Simplicity**: Does the outcome require all of the new state, branches, wrappers, dependencies, and abstractions? Always use `review-simplicity` for a dedicated deletion-first baseline pass.
5. **API correctness**: Is the API surface minimal and aligned with upstream/conventions? Are types precise and expressive? Use `review-api-design` when a public API is added or materially changed.
6. **Test adequacy**. Check new and existing tests of the affected behavior. Which failure would each catch in its environment? If the change delegates that behavior to a dependency, check its relevant assertions and identify what can still break in the caller.
7. **Blast radius**: What else in the codebase consumes the modified API/utility? Are those consumers affected?
8. **Build, dependency, and performance correctness**: Missing or unused dependencies, `sideEffects` configuration, tree-shaking implications, critical-path loading, repeated runtime work, and CSS module versus global CSS distinctions. Use `review-performance` only when bundle, runtime, rendering, layout, or scale risks are material.
9. **Documentation**: CHANGELOGs, JSDoc, README updates, Storybook stories.
10. **Scope discipline**: Are there unrelated changes that should be in separate PRs?

Specialist skills deepen a relevant domain; they do not replace the complete core review. The main workflow verifies and deduplicates their findings before delivery.

## Third-Party Impact

- **[STRONG]** Always consider how changes affect downstream consumers (plugin/theme developers, external integrators) who depend on these APIs.
