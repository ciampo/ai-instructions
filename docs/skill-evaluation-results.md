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

Current filesystem verification found that the Codex and Antigravity `review-accessibility` entrypoints both resolve to the target source, whose SHA-256 is `41ab5d85955f02edaf629afe2cf40ecb4df6882ffe9858c114509cf22b7fbf7b`. The trigger artifact records target-tree provenance for all 26 Codex skills. The Antigravity note records the entrypoint but not the historical event stream.

### Client context

| Client | Model and environment | Execution context | Overall |
| --- | --- | --- | --- |
| Codex CLI `0.145.0` | `gpt-5.6-sol`, `xhigh`, priority tier; macOS `26.5.2` arm64 | Authenticated profile; ephemeral sessions; three concurrent workers; public, self-contained fixtures; read-only trigger sandbox and disposable output workspaces | partial |
| Google Antigravity CLI `1.1.6` | Reported Gemini 3.6 Flash (High); macOS `26.5.2` arm64 | Authenticated profile; plan mode; sandbox enabled; no blanket permission bypass; raw event stream not retained | blocked, unverified |

The isolated Codex trigger rerun used one fresh outside-repository temporary directory per attempt. It disabled user configuration, rules, plugins, apps, browser and computer control, memory, hooks, remote plugins, and multi-agent tools. Positive cases stopped after the first observed skill load. Negative cases ran to turn completion or the 90-second cap and recorded every observed skill load.

Codex output runs used one disposable workspace per case and a 240-second cap. Of 55 cases, 53 completed. The runs used 9,220,259 input tokens, including 7,953,920 cached input tokens, and 147,560 output tokens.

### Evidence and method

The committed, sanitized evidence retains each prompt, observed skill-load event, model output, token use, timeout state, workspace delta, generated artifact, assertion grade, and concise evidence:

- [trigger results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-trigger-results.json), SHA-256 `80a4a7781d6ce55f68a9dda6c5a11dbf621caf804cd6d777be073a59136ab7b6`;
- [trigger runner](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/run-trigger-evaluations.mjs), SHA-256 `d15fc2d235487089c2ca622016a388521efae72c9d99beccb38ef2b498612850`;
- [output results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-output-results.json), SHA-256 `40506cae03935f37302dc8844e5981ee71ec4a29d0356b8a5558944900b6c3de`;
- [direct and coordinated comparison](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-review-comparison.json), SHA-256 `2d1be2aeb9b3799e134522676eeb423ed67f8ac9a24ce14069d1729fe51f5660`.
- [Antigravity canary note](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/antigravity-canary.json), SHA-256 `f887981706befef2d98dd8a68fe7e16e7104b5ec05d5f078155174920a1723f0`.

The versioned trigger runner records its exact invocation, feature disables, status derivation, and provenance checks. All 26 user-level Codex skill directories resolved to this checkout, and each checkout skill tree matched the target revision's Git tree object. The output campaign used an unversioned, one-off Node.js harness with one disposable writable workspace per fixture, three concurrent workers, and a 240-second cap. That output runner remains a reproducibility limitation.

Verify the retained files with:

```sh
shasum -a 256 docs/evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/*.json
```

### Codex trigger results

Every trigger case ran three times. `+` means the named skill should be the first observed load. `-` means the named skill must not load anywhere in the completed turn. A mixed three-attempt result is `partial`.

Summary: 63 of 77 cases passed, five were partial, four were blocked, and five failed. Across 231 attempts, 197 passed, 18 were blocked, and 16 failed. All cases omitted from this table passed. The retained JSON records every attempt and observed skill-load event.

| Skill | Non-pass cases |
| --- | --- |
| `address-pr-feedback` | `-write-a-single-review-reply` fail (3 `fail`) |
| `audit-dependency-update` | `+implement-package-update` partial (2 `blocked`, 1 `pass`) |
| `automattic-github-enterprise` | `-generic-enterprise-route` fail (3 `fail`) |
| `draft-review-comment` | `-address-review-feedback` fail (3 `fail`); `-perform-pr-review` fail (3 `fail`) |
| `engineering-standards` | `+scoped-code-change` partial (2 `pass`, 1 `blocked`); `+scoped-code-review` blocked (3 `blocked`) |
| `investigate-debug` | `+fix-reproduced-bug` partial (2 `pass`, 1 `blocked`) |
| `iterate-pr-review` | `-iterative-external-review` fail (3 `fail`) |
| `repository-maintenance` | `+verify-github-enterprise-cli-access` blocked (3 `blocked`) |
| `review-accessibility` | `-general-pull-request-review` partial (2 `pass`, 1 `fail`) |
| `review-coordinator` | `+implicit-multi-lane-review` blocked (3 `blocked`) |
| `review-pr` | `+multi-lane-pr-review` partial (2 `blocked`, 1 `pass`) |
| `review-simplicity` | `+ordinary-pr-review` blocked (3 `blocked`) |

### Codex output results

Assertion numbers map to each case's ordered `assertions` array in its version-controlled `evals.json`. The committed output evidence retains the assertion text, grade, concise evidence, model output, loaded skills, workspace delta, and 16 generated artifacts. Claims about conditional paths, tool execution, external state, or no mutation are `blocked` when the retained fields cannot prove them.

Summary: 18 of 55 output cases passed, 36 were partial, and one was blocked. Across 194 assertions, 121 passed, three failed, and 70 were blocked. All cases omitted from this table passed. The retained JSON lists every assertion result.

| Skill | Non-pass cases |
| --- | --- |
| `address-pr-feedback` | `explicit-no-write-assessment` partial; `fresh-feedback-snapshot` partial; `chat-only-replies-with-local-fixes` partial |
| `audit-dependency-update` | `read-only-major-update-audit` partial |
| `automattic-github-enterprise` | `automattic-enterprise-macos-preflight` partial |
| `draft-review-comment` | `mixed-finding-locations` partial; `chat-only-delivery` partial; `no-artifact-delivery` partial; `explicit-no-write-delivery` partial; `explicit-no-modify-delivery` partial |
| `engineering-standards` | `load-only-relevant-standards` partial |
| `investigate-debug` | `diagnosis-only-boundary` partial |
| `iterate-pr-review` | `review-only-authority` blocked; `current-head-convergence` partial; `fallback-without-sibling-skills` partial; `local-only-fix-authority` partial |
| `prepare-release` | `no-write-release-plan` partial |
| `refactor` | `public-rename-migration-fork` partial |
| `release-publish` | `legacy-route-preserves-no-write-boundary` partial; `legacy-publish-stops-on-no-local-changes` partial |
| `repository-maintenance` | `github-enterprise-read-route` partial |
| `resume-session` | `conflicting-recovered-state` partial |
| `review-accessibility` | `no-artifact-delivery` partial |
| `review-api-design` | `chat-only-delivery` partial |
| `review-compatibility` | `chat-only-delivery` partial |
| `review-coordinator` | `single-chat-only-review` partial |
| `review-documentation` | `chat-only-delivery` partial |
| `review-internationalization` | `chat-only-delivery` partial |
| `review-performance` | `chat-only-delivery` partial |
| `review-pr` | `chat-only-synthesized-review` partial; `read-only-synthesized-review` partial |
| `review-security` | `chat-only-delivery` partial |
| `review-simplicity` | `chat-only-delivery` partial |
| `review-test-quality` | `chat-only-delivery` partial |
| `self-review-pr` | `chat-only-self-review` partial; `independent-snapshot-self-review` partial |
| `write-pr-description` | `behavior-first-local-draft` partial |

The three failed assertions are: the `address-pr-feedback` run timed out before returning draft replies; the Enterprise preflight response instructed the user to run its probes instead of executing them outside the sandbox; and the current-head iteration output omitted the base revision. The 70 blocked assertions are evidence gaps, not accepted instruction failures.

### Direct and coordinated review comparison

Both runs used `skills/review-pr/evals/fixtures/coordinator-handoff-routing.md` from the target revision. Each found the same authorization and persisted-state problems, with no duplicate or false-positive finding. Severity normalization differed.

| Path | Findings | Severity | Wall time | Tokens |
| --- | --- | --- | --- | --- |
| Direct `review-pr` | Missing object-level deletion authorization; missing persisted-preference migration | `critical`, `major` | 86.853 seconds | 308,725 input, 277,760 cached input, 4,129 output |
| `review-coordinator` | Same two findings | `major`, `minor` | 110.037 seconds | 586,586 input, 548,352 cached input, 4,691 output |

The coordinated path took 23.184 seconds longer and used 277,861 more input tokens. The lower severities are an accepted normalization inconsistency, not a false positive or duplicate.

### Antigravity canary

The `review-accessibility/no-artifact-delivery` canary is blocked, but its historical result is unverified. The run reported that headless plan mode auto-denied `read_file` because it could not present an approval prompt. It also reported no model response, review artifact, source change, or remote change. The campaign did not retain the raw event stream or a filesystem delta, so those observations cannot be audited. The recorded invocation did not use `--dangerously-skip-permissions` or change the user's permission settings.

### Accepted failures and follow-ups

The accepted instruction failures are:

1. A single review-reply request selected `address-pr-feedback` instead of `draft-review-comment` in all three attempts.
2. A generic non-Automattic Enterprise request selected `automattic-github-enterprise` in all three attempts.
3. An address-feedback workflow loaded `draft-review-comment` in all three negative attempts.
4. A general pull-request review loaded `draft-review-comment` in all three negative attempts.
5. An iterative review request for another author's pull request selected `iterate-pr-review` in all three attempts.
6. The chat-only feedback run timed out before it returned the draft replies.
7. The Enterprise preflight response told the user to run the required probes instead of executing them outside the sandbox.
8. The current-head iteration output omitted the base revision.
9. Direct and coordinated review assigned materially different severities to the same two findings.

Partial and blocked trigger cases are routing gaps, not accepted failures. Blocked output assertions are evidence gaps. The two timed-out output cases and the unverified Antigravity canary remain verification gaps except for their explicitly retained evidence.

Do not fix these failures in this evidence pull request. Open focused follow-up issues or pull requests before changing the evaluated instruction revision. Remote issue creation was not part of this campaign's authorization, so those links remain required before this campaign can be considered complete.
