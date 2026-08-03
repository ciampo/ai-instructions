# Skill Evaluation Results

Status: partial. The Codex campaign completed with confirmed routing and output gaps. The Antigravity canary is blocked by headless permission handling.

## Purpose

This is the durable ledger for model-backed skill evaluations. Fixture validation proves that the cases are complete and self-contained. It does not prove that a client loaded the intended skill or produced the expected result.

Record each evaluation campaign against immutable repository and fixture commit SHAs. Do not combine outputs from different revisions into one result.

## Result contract

Each campaign must record:

- repository and evaluation-fixture commit SHAs;
- client name, exact version, model, and inference configuration;
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

Repository revision: `561a88a0b1adcfadfed2b08f2efe195436341d1a` on `main`.

Evaluation-fixture revision: `561a88a0b1adcfadfed2b08f2efe195436341d1a`.

| Prerequisite | Required behavior | Status |
| --- | --- | --- |
| [PR #69](https://github.com/ciampo/ai-instructions/pull/69) | No-file review delivery with authorized local fixes, verification, commits, and pushes; separate authority for public and administrative pull-request actions | Merged in target |
| [PR #70](https://github.com/ciampo/ai-instructions/pull/70) | Evaluation fixtures for all distributed skills | Merged in target |
| [PR #71](https://github.com/ciampo/ai-instructions/pull/71) | Immutable, least-privilege CI baseline | Merged in target |

The installed Codex and Antigravity `review-accessibility` skill entrypoints both matched the target revision at SHA-256 `41ab5d85955f02edaf629afe2cf40ecb4df6882ffe9858c114509cf22b7fbf7b`.

### Client context

| Client | Model and environment | Execution context | Overall |
| --- | --- | --- | --- |
| Codex CLI `0.145.0` | `gpt-5.6-sol`, `xhigh`, priority tier; macOS `26.5.2` arm64 | Authenticated profile; ephemeral sessions; three concurrent workers; public, self-contained fixtures; read-only trigger sandbox and disposable output workspaces | partial |
| Google Antigravity CLI `1.1.6` | Configured Gemini 3.6 Flash (High); macOS `26.5.2` arm64 | Authenticated profile; plan mode; sandbox enabled; no blanket permission bypass | blocked |

Codex trigger runs stopped after the first observable skill load, or after 90 seconds. This proves a direct first selection. It cannot prove that a sibling workflow would or would not load another skill later. Positive cases that selected another skill are `blocked` attempts. Negative cases are `blocked` unless the prohibited skill was selected first, which is a confirmed failure.

Codex output runs used one disposable workspace per case and a 240-second cap. Of 55 cases, 53 completed. The runs used 9,220,259 input tokens, including 7,953,920 cached input tokens, and 147,560 output tokens.

### Evidence and method

The committed, sanitized evidence retains each prompt, observed first skill selection, model output, token use, timeout state, workspace delta, assertion grade, and concise evidence:

- [trigger results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-trigger-results.json), SHA-256 `0618216bb2c95164eb0c8e31b5894fa099282d830eb79a2ec0d4283c74730a17`;
- [output results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-output-results.json), SHA-256 `7da2db3df18cc3c71a642cfd368a5b6e1c26243a280d9391546b7feed55ff5a3`;
- [direct and coordinated comparison](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-review-comparison.json), SHA-256 `2d1be2aeb9b3799e134522676eeb423ed67f8ac9a24ce14069d1729fe51f5660`.

An unversioned, one-off Node.js harness invoked Codex CLI with ephemeral sessions and JSON output. Trigger runs used a read-only empty workspace, three concurrent workers, a 90-second cap, and stopped at the first observable skill load. Output runs used one disposable writable workspace per fixture, three concurrent workers, and a 240-second cap. The JSON records the invocation template and status derivation. This unversioned runner is a reproducibility limitation.

Verify the retained files with:

```sh
shasum -a 256 docs/evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/*.json
```

### Codex trigger results

Every trigger case ran three times. Positive cases pass only when the intended skill was the first observed load. All 37 negative cases are blocked by the early-stop method unless the prohibited skill was selected first.

Summary: 23 of 77 cases passed, 14 were partial, 37 were blocked, and three failed. Across 231 attempts, 91 passed, 131 were blocked, and nine failed. The three failed negative cases selected the prohibited skill first in all three attempts. The other 34 negative cases remain blocked and must run to completion before they can pass.

| Skill | Passing positive cases | Non-pass positive cases | Confirmed negative first-load failures |
| --- | --- | --- | --- |
| `address-pr-feedback` | `address-current-pr-feedback` | — | `write-a-single-review-reply` (`address-pr-feedback` 3) |
| `audit-dependency-update` | `implement-package-update` | `audit-existing-update` partial (`audit-dependency-update` 1, `review-compatibility` 1, timeout 1) | — |
| `automattic-github-enterprise` | `automattic-enterprise-auth-failure`, `automattic-enterprise-pr-read` | — | `generic-enterprise-route` (`automattic-github-enterprise` 3) |
| `draft-review-comment` | `draft-confirmed-findings`, `prepare-review-document` | — | — |
| `engineering-standards` | `scoped-code-change` | `scoped-code-review` partial (`engineering-standards` 1, `review-accessibility` 2) | — |
| `investigate-debug` | `diagnose-regression` | `fix-reproduced-bug` partial (`investigate-debug` 2, `engineering-standards` 1) | — |
| `iterate-pr-review` | `repeat-copilot-and-self-review`, `review-before-handoff` | — | `iterative-external-review` (`iterate-pr-review` 3) |
| `prepare-release` | `plan-release-without-local-writes` | — | — |
| `publish-release` | `ship-verified-package` | `publish-prepared-release` partial (`publish-release` 2, `repository-maintenance` 1) | — |
| `refactor` | `systematic-api-migration` | `codebase-wide-rename` partial (`refactor` 2, no load 1) | — |
| `release-publish` | `legacy-plan-only-release-request` | `legacy-publish-prepared-release-without-local-changes` partial (`release-publish` 2, no load 1) | — |
| `repository-maintenance` | — | `verify-github-enterprise-cli-access` blocked (`automattic-github-enterprise` 3) | — |
| `resume-session` | `continue-pr-work` | `recover-interrupted-session` partial (`resume-session` 2, `repository-maintenance` 1) | — |
| `review-accessibility` | `implicit-dialog-audit` | — | — |
| `review-api-design` | — | `public-component-api` partial (`review-api-design` 2, timeout 1) | — |
| `review-compatibility` | `persisted-format-upgrade` | — | — |
| `review-coordinator` | — | `explicit-panel-review` partial (`review-coordinator` 1, timeout 2); `implicit-multi-lane-review` blocked (`review-pr` 2, timeout 1) | — |
| `review-documentation` | `migration-guide-review` | — | — |
| `review-internationalization` | — | `localized-message-and-rtl` partial (`review-internationalization` 2, no load 1) | — |
| `review-performance` | `rendering-cost-audit` | — | — |
| `review-pr` | — | `review-a-shared-pr` partial (`review-pr` 1, no load 2); `multi-lane-pr-review` partial (`review-pr` 1, browser skill 1, timeout 1) | — |
| `review-security` | `authorization-boundary` | — | — |
| `review-simplicity` | `deletion-first-review` | `ordinary-pr-review` blocked (`review-pr` 3) | — |
| `review-test-quality` | `semantic-ui-regression` | — | — |
| `self-review-pr` | — | `review-current-pr-before-ready` partial (`self-review-pr` 1, browser skill 1, timeout 1) | — |
| `write-pr-description` | `draft-description` | `update-remote-description` partial (`write-pr-description` 2, timeout 1) | — |

### Codex output results

Assertion numbers map to each case's ordered `assertions` array in its version-controlled `evals.json`. The committed output evidence retains the text, grade, and evidence for every assertion, plus the model output and workspace delta used to audit that grade. All assertions in a passing case passed. Non-pass rows list every assertion result explicitly.

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
| Direct `review-pr` | Missing object-level deletion authorization; missing persisted-preference migration | `critical`, `major` | 86.853 seconds | 308,725 input, 277,760 cached input, 4,129 output |
| `review-coordinator` | Same two findings | `major`, `minor` | 110.037 seconds | 586,586 input, 548,352 cached input, 4,691 output |

The coordinated path took 23.184 seconds longer and used 277,861 more input tokens. The lower severities are an accepted normalization inconsistency, not a false positive or duplicate.

### Antigravity canary

The `review-accessibility/no-artifact-delivery` canary is blocked. In headless plan mode, Antigravity auto-denied the required `read_file` permission because it could not present an approval prompt. No model response, review artifact, source change, or remote change was produced. The campaign did not use `--dangerously-skip-permissions` and did not change the user's permission settings.

### Accepted failures and follow-ups

The accepted instruction failures are:

1. A single review-reply request selected `address-pr-feedback` instead of `draft-review-comment` in all three attempts.
2. A generic non-Automattic Enterprise request selected `automattic-github-enterprise` in all three attempts.
3. An iterative review request for another author's pull request selected `iterate-pr-review` in all three attempts.
4. The current-head iteration output omitted the base revision and could not demonstrate the full pending-review and default-limit contract.
5. Direct and coordinated review assigned materially different severities to the same two findings.

The positive partial and blocked trigger cases are not accepted failures because first-load observation cannot establish later workflow composition. The 34 negative cases that did not first-load the prohibited skill are also blocked, not passing, because the harness did not run them to completion. The two timed-out output cases remain verification gaps except for their explicitly recorded assertion results.

Do not fix these failures in this evidence pull request. Open focused follow-up issues or pull requests before changing the evaluated instruction revision. Remote issue creation was not part of this campaign's authorization, so those links remain required before this campaign can be considered complete.
