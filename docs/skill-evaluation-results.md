# Skill Evaluation Results

Status: partial. The Codex campaign completed with confirmed routing and output gaps. The Antigravity canary is reported blocked, but its cause and safety state are unverified.

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
| Google Antigravity CLI `1.1.6` | Reported Gemini 3.6 Flash (High); macOS `26.5.2` arm64 | Reported authenticated profile, plan mode, and sandbox; permission settings, safety state, and raw event stream unverified | blocked, unverified |

The isolated Codex trigger rerun used one fresh outside-repository temporary directory per attempt. It disabled user configuration, rules, plugins, apps, browser and computer control, memory, hooks, remote plugins, and multi-agent tools. Positive cases stopped after the target skill loaded. Negative cases ran to turn completion or the 90-second timeout and recorded every observed skill load.

Codex output runs used one disposable workspace per case and a 240-second cap. Of 55 cases, 53 completed. The runs used 9,220,259 input tokens, including 7,953,920 cached input tokens, and 147,560 output tokens.

### Evidence and method

The committed, sanitized evidence retains each prompt, observed skill-load event, model output, token use, timeout state, workspace delta, generated artifact, assertion grade, and concise evidence:

- [trigger results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-trigger-results.json), SHA-256 `93a4a17376a1be809174e07c98cdab16de2b08e48fcf318985710261ac64dfb7`;
- [trigger runner](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/run-trigger-evaluations.mjs), SHA-256 `b5f2275e8b26b24dc258875c065ceb6eaac5f7b09ea28f1007cf693969cb8f56`;
- [output results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-output-results.json), SHA-256 `89eb73f0a0d3cc906f32e33ef7118fb233eccdc5982aef2f60e78b744178913f`;
- [direct and coordinated comparison](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-review-comparison.json), SHA-256 `2d1be2aeb9b3799e134522676eeb423ed67f8ac9a24ce14069d1729fe51f5660`.
- [Antigravity canary note](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/antigravity-canary.json), SHA-256 `f521622ad936bf76d62292bf630a930c2629e692a0d883cde6af6ee3121425de`.

The versioned trigger runner records its exact invocation, feature disables, status derivation, and provenance checks. It counts only successful, completed commands whose output contains the loaded skill's frontmatter, and it runs deterministic classifier self-checks before the campaign. It checks tracked and untracked skill files, terminates the complete child-process tree at the timeout with a two-second forced-kill fallback, and sanitizes both logical and resolved temporary paths. All 26 user-level Codex skill directories resolved to this checkout, and each checkout skill tree matched the target revision's Git tree object. The output campaign used an unversioned, one-off Node.js harness with one disposable writable workspace per fixture, three concurrent workers, and a 240-second cap. That output runner remains a reproducibility limitation.

Verify the retained files with:

```sh
shasum -a 256 docs/evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/*.json
```

### Codex trigger results

Every trigger case ran three times. `+` means the named skill should load during the turn. `-` means the named skill must not load anywhere in the completed turn. A mixed three-attempt result is `partial`.

Summary: 66 of 77 cases passed, five were partial, and six failed. Across 231 attempts, 208 passed and 23 failed. All cases omitted from this table passed. The retained JSON records every attempt and observed skill-load event.

| Skill | Non-pass cases |
| --- | --- |
| `address-pr-feedback` | `-write-a-single-review-reply` fail (3 `fail`) |
| `automattic-github-enterprise` | `-generic-enterprise-route` fail (3 `fail`) |
| `draft-review-comment` | `-address-review-feedback` fail (3 `fail`); `+draft-confirmed-findings` partial (2 `pass`, 1 `fail`); `-perform-pr-review` fail (3 `fail`); `+prepare-review-document` partial (2 `pass`, 1 `fail`) |
| `engineering-standards` | `-resume-session` partial (2 `pass`, 1 `fail`) |
| `iterate-pr-review` | `-iterative-external-review` fail (3 `fail`) |
| `repository-maintenance` | `+verify-github-enterprise-cli-access` fail (3 `fail`) |
| `review-coordinator` | `+implicit-multi-lane-review` partial (2 `pass`, 1 `fail`) |
| `review-test-quality` | `+semantic-ui-regression` partial (2 `pass`, 1 `fail`) |

### Codex output results

Assertion numbers map to each case's ordered `assertions` array in its version-controlled `evals.json`. The committed output evidence retains the assertion text, grade, concise evidence, model output, loaded skills, workspace delta, and 16 generated artifacts. Claims about conditional paths, tool execution, external state, or no mutation are `blocked` when the retained fields cannot prove them.

Summary: 17 of 55 output cases passed, 35 were partial, and three were blocked. Across 194 assertions, 117 passed, three failed, and 74 were blocked. All cases omitted from this table passed. The retained JSON lists every assertion result.

| Skill | Non-pass cases |
| --- | --- |
| `address-pr-feedback` | `explicit-no-write-assessment` partial; `fresh-feedback-snapshot` blocked; `chat-only-replies-with-local-fixes` partial |
| `audit-dependency-update` | `read-only-major-update-audit` partial |
| `automattic-github-enterprise` | `automattic-enterprise-macos-preflight` partial |
| `draft-review-comment` | `mixed-finding-locations` partial; `chat-only-delivery` partial; `no-artifact-delivery` partial; `explicit-no-write-delivery` partial; `explicit-no-modify-delivery` partial |
| `engineering-standards` | `load-only-relevant-standards` partial |
| `investigate-debug` | `diagnosis-only-boundary` partial |
| `iterate-pr-review` | `review-only-authority` blocked; `current-head-convergence` partial; `fallback-without-sibling-skills` partial; `local-only-fix-authority` blocked |
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
| `review-pr` | `chat-only-synthesized-review` partial; `coordinator-handoff-routing` partial; `read-only-synthesized-review` partial |
| `review-security` | `chat-only-delivery` partial |
| `review-simplicity` | `chat-only-delivery` partial |
| `review-test-quality` | `chat-only-delivery` partial |
| `self-review-pr` | `chat-only-self-review` partial; `independent-snapshot-self-review` partial |
| `write-pr-description` | `behavior-first-local-draft` partial |

The three failed assertions are: the `address-pr-feedback` run timed out before returning draft replies; the Enterprise preflight response instructed the user to run its probes instead of executing them outside the sandbox; and the current-head iteration output omitted the base revision. The 74 blocked assertions are evidence gaps, not accepted instruction failures.

### Direct and coordinated review comparison

Both runs used `skills/review-pr/evals/fixtures/coordinator-handoff-routing.md` from the target revision. Each found the same authorization and persisted-state problems, with no duplicate or false-positive finding. Severity normalization differed.

| Path | Findings | Severity | Wall time | Tokens |
| --- | --- | --- | --- | --- |
| Direct `review-pr` | Missing object-level deletion authorization; missing persisted-preference migration | `critical`, `major` | 86.853 seconds | 308,725 input, 277,760 cached input, 4,129 output |
| `review-coordinator` | Same two findings | `major`, `minor` | 110.037 seconds | 586,586 input, 548,352 cached input, 4,691 output |

The coordinated path took 23.184 seconds longer and used 277,861 more input tokens. The lower severities are an accepted normalization inconsistency, not a false positive or duplicate.

### Antigravity canary

The `review-accessibility/no-artifact-delivery` canary is reported blocked, but its historical result is unverified. The run reportedly auto-denied `read_file` in headless plan mode because it could not present an approval prompt. It also reportedly produced no model response, review artifact, source change, or remote change. The campaign did not retain the raw event stream or a filesystem delta, so those observations cannot be audited. The historical note reports that the invocation did not use `--dangerously-skip-permissions` or change the user's permission settings, but that safety state is also unverified.

### Accepted failures and follow-ups

The accepted instruction failures are:

1. A single review-reply request selected `address-pr-feedback` instead of `draft-review-comment` in all three attempts. Follow-up: [#73](https://github.com/ciampo/ai-instructions/issues/73).
2. A generic non-Automattic Enterprise request selected `automattic-github-enterprise` in all three attempts. Follow-up: [#74](https://github.com/ciampo/ai-instructions/issues/74).
3. An address-feedback workflow loaded `draft-review-comment` in all three negative attempts. Follow-up: [#73](https://github.com/ciampo/ai-instructions/issues/73).
4. A general pull-request review loaded `draft-review-comment` in all three negative attempts. Follow-up: [#73](https://github.com/ciampo/ai-instructions/issues/73).
5. An iterative review request for another author's pull request selected `iterate-pr-review` in all three attempts. Follow-up: [#75](https://github.com/ciampo/ai-instructions/issues/75).
6. The Enterprise CLI verification request did not load `repository-maintenance` in all three positive attempts. Follow-up: [#76](https://github.com/ciampo/ai-instructions/issues/76).
7. The chat-only feedback run timed out before it returned the draft replies. Follow-up: [#77](https://github.com/ciampo/ai-instructions/issues/77).
8. The Enterprise preflight response told the user to run the required probes instead of executing them outside the sandbox. Follow-up: [#78](https://github.com/ciampo/ai-instructions/issues/78).
9. The current-head iteration output omitted the base revision. Follow-up: [#79](https://github.com/ciampo/ai-instructions/issues/79).
10. Direct and coordinated review assigned materially different severities to the same two findings. Follow-up: [#80](https://github.com/ciampo/ai-instructions/issues/80).

Partial and blocked trigger cases are routing gaps, not accepted failures. Blocked output assertions are evidence gaps. The two timed-out output cases and the unverified Antigravity canary remain verification gaps except for their explicitly retained evidence.

Do not fix these failures in this evidence pull request. Use the focused follow-ups above before changing the evaluated instruction revision.
