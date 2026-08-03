# Skill Evaluation Results

Status: partial. The Codex campaign completed with confirmed routing and output gaps. The Antigravity canary is blocked by headless permission handling.

## Purpose

This is the durable ledger for model-backed skill evaluations. Fixture validation proves that the cases are complete and self-contained. It does not prove that a client loaded the intended skill or produced the expected result.

Record each evaluation campaign against one immutable repository revision. Do not combine outputs from different revisions into one result.

## Result contract

Each campaign must record:

- repository revision and evaluation-fixture revision;
- client name and exact version;
- authentication and tool-access context when it affects behavior;
- skill name and trigger or output case ID;
- at least three trigger attempts and whether the client loaded the skill;
- each output assertion as `pass`, `fail`, or `blocked`, with concise evidence;
- comparison revision or no-skill baseline when that comparison is material;
- wall time and token use when comparing direct and coordinated review;
- overall status as `pass`, `partial`, or `blocked`;
- follow-up issue or pull request for every accepted instruction failure.

Static fixture validation, installation checks, or one successful prompt cannot by themselves produce a `pass` result.

## Active campaign

Target revision: `561a88a0b1adcfadfed2b08f2efe195436341d1a` on `main`.

| Prerequisite | Required behavior | Status |
| --- | --- | --- |
| [PR #69](https://github.com/ciampo/ai-instructions/pull/69) | No-file review delivery and review-only iterative launcher | Merged in target |
| [PR #70](https://github.com/ciampo/ai-instructions/pull/70) | Evaluation fixtures for all distributed skills | Merged in target |
| [PR #71](https://github.com/ciampo/ai-instructions/pull/71) | Immutable, least-privilege CI baseline | Merged in target |

The installed Codex and Antigravity `review-accessibility` skill entrypoints both matched the target revision at SHA-256 `41ab5d85955f02edaf629afe2cf40ecb4df6882ffe9858c114509cf22b7fbf7b`.

### Client context

| Client | Model and environment | Execution context | Overall |
| --- | --- | --- | --- |
| Codex CLI `0.145.0` | `gpt-5.6-sol`, `xhigh`, priority tier; macOS `26.5.2` arm64 | Authenticated profile; ephemeral sessions; three concurrent workers; public, self-contained fixtures; read-only trigger sandbox and disposable output workspaces | partial |
| Google Antigravity CLI `1.1.6` | Configured Gemini 3.6 Flash (High); macOS `26.5.2` arm64 | Authenticated profile; plan mode; sandbox enabled; no blanket permission bypass | blocked |

Codex trigger runs stopped after the first observable skill load, or after 90 seconds. This proves a direct first selection. It cannot prove that a sibling workflow would or would not load another skill later. Such positive composition cases are `blocked`, not failed. A negative case is a confirmed failure only when the prohibited skill was the first selection.

Codex output runs used one disposable workspace per case and a 240-second cap. Of 55 cases, 53 completed. The runs used 9,220,259 input tokens, including 7,953,920 cached input tokens, and 147,560 output tokens. Raw trigger and output result JSON had SHA-256 values `e70a5c245593c9dd038f46d0167e5c543f564bf98556eee146cf9dffba6a6ef6` and `65fb6860877439663ad3b9a6393b20ff4054f83904a41151c66556c664933143` respectively.

### Codex trigger results

Every trigger case ran three times. `+` means the fixture expected the named skill to load. `-` means the fixture expected it not to load. Complete cases matched the expected direct selection in all three attempts. A timeout without an observed load is `blocked`.

Summary: 50 of 77 cases passed, 20 were partial, four were blocked, and three failed. Across 231 attempts, 184 passed, 38 were blocked, and nine failed.

| Skill | Complete cases | Non-pass cases |
| --- | --- | --- |
| `address-pr-feedback` | `+address-current-pr-feedback` | `-write-a-single-review-reply` fail (`address-pr-feedback` 3) |
| `audit-dependency-update` | `+implement-package-update`, `-debug-runtime-error`, `-publish-prepared-release` | `+audit-existing-update` partial (`audit-dependency-update` 1, `review-compatibility` 1, no load before timeout 1) |
| `automattic-github-enterprise` | `+automattic-enterprise-auth-failure`, `+automattic-enterprise-pr-read` | `-generic-enterprise-route` fail (`automattic-github-enterprise` 3) |
| `draft-review-comment` | `+draft-confirmed-findings`, `+prepare-review-document`, `-perform-pr-review`, `-address-review-feedback` | — |
| `engineering-standards` | `+scoped-code-change`, `-write-pr-description`, `-resume-session` | `+scoped-code-review` partial (`engineering-standards` 1, `review-accessibility` 2) |
| `investigate-debug` | `+diagnose-regression`, `-systematic-rename`, `-general-pr-review` | `+fix-reproduced-bug` partial (`investigate-debug` 2, `engineering-standards` 1) |
| `iterate-pr-review` | `+repeat-copilot-and-self-review`, `+review-before-handoff`, `-one-time-external-review` | `-one-time-authored-review` partial (`self-review-pr` 1, browser skill 1, timeout 1); `-iterative-external-review` fail (`iterate-pr-review` 3) |
| `prepare-release` | `+plan-release-without-local-writes`, `-publish-prepared-release` | — |
| `publish-release` | `+ship-verified-package`, `-audit-dependency-release` | `+publish-prepared-release` partial (`publish-release` 2, `repository-maintenance` 1); `-prepare-release-only` partial (`prepare-release` 1, no skill 1, timeout 1) |
| `refactor` | `+systematic-api-migration`, `-simplicity-review-only` | `+codebase-wide-rename` partial (`refactor` 2, no skill 1); `-single-bug-fix` partial (no skill 2, timeout 1) |
| `release-publish` | `+legacy-plan-only-release-request`, `-publish-an-existing-release` | `+legacy-publish-prepared-release-without-local-changes` partial (`release-publish` 2, no skill 1) |
| `repository-maintenance` | `-summarize-enterprise-access-guidance` | `+verify-github-enterprise-cli-access` blocked (`automattic-github-enterprise` 3) |
| `resume-session` | `+continue-pr-work`, `-start-new-refactor`, `-repository-status-only` | `+recover-interrupted-session` partial (`resume-session` 2, `repository-maintenance` 1) |
| `review-accessibility` | `+implicit-dialog-audit` | `-general-pull-request-review` partial (`review-pr` 2, timeout 1) |
| `review-api-design` | `-internal-refactor` | `+public-component-api` partial (`review-api-design` 2, timeout 1) |
| `review-compatibility` | `+persisted-format-upgrade`, `-public-prop-ergonomics` | — |
| `review-coordinator` | — | `+explicit-panel-review` partial (`review-coordinator` 1, timeout 2); `+implicit-multi-lane-review` blocked (`review-pr` 2, timeout 1); `-ordinary-pr-review` blocked (timeout 3) |
| `review-documentation` | `+migration-guide-review`, `-implementation-correctness` | — |
| `review-internationalization` | `-security-boundary-review` | `+localized-message-and-rtl` partial (`review-internationalization` 2, no skill 1) |
| `review-performance` | `+rendering-cost-audit`, `-general-style-review` | — |
| `review-pr` | `-focused-accessibility-audit` | `+review-a-shared-pr` partial (`review-pr` 1, no skill 2); `+multi-lane-pr-review` partial (`review-pr` 1, browser skill 1, timeout 1) |
| `review-security` | `+authorization-boundary`, `-visual-copy-review` | — |
| `review-simplicity` | `+deletion-first-review`, `-implementation-request`, `-performance-only-review` | `+ordinary-pr-review` blocked (`review-pr` 3) |
| `review-test-quality` | `+semantic-ui-regression`, `-aria-semantics-audit` | — |
| `self-review-pr` | `-review-another-authors-pr` | `+review-current-pr-before-ready` partial (`self-review-pr` 1, browser skill 1, timeout 1) |
| `write-pr-description` | `+draft-description` | `+update-remote-description` partial (`write-pr-description` 2, timeout 1); `-review-pull-request` partial (`review-pr` 2, timeout 1); `-implement-feature` partial (`investigate-debug` 2, timeout 1) |

### Codex output results

Assertion numbers map to each case's ordered `assertions` array in its version-controlled `evals.json`. All assertions in a passing case passed. Non-pass rows list every assertion result explicitly.

Summary: 52 of 55 output cases passed and three were partial. Across 194 assertions, 184 passed, two failed, and eight were blocked.

| Skill | Passing cases | Non-pass assertion results |
| --- | --- | --- |
| `address-pr-feedback` | `explicit-no-write-assessment`, `fresh-feedback-snapshot` | `chat-only-replies-with-local-fixes` partial (1 `pass`, 2 `fail`, 3 `pass`) |
| `audit-dependency-update` | `read-only-major-update-audit` | — |
| `automattic-github-enterprise` | `automattic-enterprise-macos-preflight` | — |
| `draft-review-comment` | `mixed-finding-locations`, `chat-only-delivery`, `no-artifact-delivery`, `explicit-no-write-delivery`, `explicit-no-modify-delivery` | — |
| `engineering-standards` | `load-only-relevant-standards` | — |
| `investigate-debug` | `diagnosis-only-boundary` | — |
| `iterate-pr-review` | `limit-reached-final-pass`, `review-only-authority`, `fallback-without-sibling-skills`, `local-only-fix-authority` | `current-head-convergence` partial (1 `fail`, 2–4 `blocked`, 5–8 `pass`) |
| `prepare-release` | `no-write-release-plan` | — |
| `publish-release` | `ambiguous-publish-target` | — |
| `refactor` | `public-rename-migration-fork` | — |
| `release-publish` | `legacy-route-preserves-no-write-boundary`, `legacy-publish-stops-on-no-local-changes` | — |
| `repository-maintenance` | `github-enterprise-read-route` | — |
| `resume-session` | `conflicting-recovered-state` | — |
| `review-accessibility` | `source-proven-read-only-finding`, `no-artifact-delivery` | — |
| `review-api-design` | `consumer-grounded-api-review`, `incomplete-api-context`, `chat-only-delivery` | — |
| `review-compatibility` | `chat-only-delivery`, `supported-transition-evidence` | — |
| `review-coordinator` | `single-chat-only-review`, `single-evidence-backed-review` | — |
| `review-documentation` | `reader-impactful-concision`, `chat-only-delivery` | — |
| `review-internationalization` | `full-sentence-message`, `chat-only-delivery` | — |
| `review-performance` | `unmeasured-rendering-hypothesis`, `measured-rendering-budget-breach`, `chat-only-delivery`, `measured-without-performance-contract` | — |
| `review-pr` | `ordinary-direct-specialist-routing`, `chat-only-synthesized-review`, `coordinator-handoff-routing` | `read-only-synthesized-review` partial (1 `pass`, 2–5 `blocked`, 6 `pass`, 7 `blocked`) |
| `review-security` | `reachable-authorization-failure`, `chat-only-delivery` | — |
| `review-simplicity` | `remove-duplicated-derived-state`, `retain-minimal-public-component`, `chat-only-delivery` | — |
| `review-test-quality` | `chat-only-delivery`, `behavioral-ui-assertion` | — |
| `self-review-pr` | `chat-only-self-review`, `independent-snapshot-self-review` | — |
| `write-pr-description` | `behavior-first-local-draft` | — |

The `address-pr-feedback` partial case applied and verified the fixture fixes but hit the cap before it returned the replies in chat. The `iterate-pr-review` partial case omitted the base revision and could not exercise completed dual reviews, the default round limit, or pending-review waiting against the unavailable example repository. The `review-pr` partial case kept source unchanged and loaded the simplicity baseline, but an execution-directory mistake and timeout prevented boundary refresh and final synthesis.

### Direct and coordinated review comparison

Both runs used `skills/review-pr/evals/fixtures/coordinator-handoff-routing.md` from the target revision. Each found the same authorization and persisted-state problems, with no duplicate or false-positive finding. Severity normalization differed.

| Path | Findings | Severity | Wall time | Tokens |
| --- | --- | --- | --- | --- |
| Direct `review-pr` | Missing object-level deletion authorization; missing persisted-preference migration | `critical`, `major` | 86.9 seconds | 308,725 input, 277,760 cached input, 4,129 output |
| `review-coordinator` | Same two findings | `major`, `minor` | 110.0 seconds | 586,586 input, 548,352 cached input, 4,691 output |

The coordinated path took 23.2 seconds longer and used 277,861 more input tokens. The lower severities are an accepted normalization inconsistency, not a false positive or duplicate.

### Antigravity canary

The `review-accessibility/no-artifact-delivery` canary is blocked. In headless plan mode, Antigravity auto-denied the required `read_file` permission because it could not present an approval prompt. No model response, review artifact, source change, or remote change was produced. The campaign did not use `--dangerously-skip-permissions` and did not change the user's permission settings.

### Accepted failures and follow-ups

The accepted instruction failures are:

1. A single review-reply request selected `address-pr-feedback` instead of `draft-review-comment` in all three attempts.
2. A generic non-Automattic Enterprise request selected `automattic-github-enterprise` in all three attempts.
3. An iterative review request for another author's pull request selected `iterate-pr-review` in all three attempts.
4. The current-head iteration output omitted the base revision and could not demonstrate the full pending-review and default-limit contract.
5. Direct and coordinated review assigned materially different severities to the same two findings.

The positive partial and blocked trigger cases are not accepted failures because first-load observation cannot establish later workflow composition. The two timed-out output cases remain verification gaps except for their explicitly recorded assertion results.

Do not fix these failures in this evidence pull request. Open focused follow-up issues or pull requests before changing the evaluated instruction revision. Remote issue creation was not part of this campaign's authorization, so those links remain required before this campaign can be considered complete.
