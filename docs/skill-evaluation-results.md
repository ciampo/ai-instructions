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
| Codex CLI `0.145.0` | `gpt-5.6-sol`, `xhigh`, priority tier; macOS `26.5.2` arm64 | Private authentication copies; isolated home and session store; explicit environment allowlist; exact pinned skill inventory; three concurrent workers; public, self-contained fixtures; read-only trigger sandbox and disposable output workspaces | partial |
| Google Antigravity CLI `1.1.6` | Reported Gemini 3.6 Flash (High); macOS `26.5.2` arm64 | Reported authenticated profile, plan mode, and sandbox; permission settings, safety state, and raw event stream unverified | blocked, unverified |

The isolated Codex trigger rerun used one fresh outside-repository temporary directory and one clean session store per attempt. Each session store received a private authentication copy. The subprocess inherited neither the host environment nor the host home directory. Its isolated home exposed exactly the 26 pinned user-level skills, and its environment contained only `CODEX_HOME`, `HOME`, `LANG`, `LC_ALL`, `NO_COLOR`, `PATH`, `SHELL`, `TERM`, and `TMPDIR`. The runner disabled user configuration, rules, plugins, apps, browser and computer control, memory, hooks, remote plugins, and multi-agent tools. Positive cases stopped after the target skill loaded. Negative cases ran to turn completion or the 90-second timeout and recorded every observed skill load. The runner drained stderr completely and retained a sanitized preview plus the full-stream SHA-256 for every attempt.

Codex output runs used one disposable workspace per case and a 240-second cap. Of 55 cases, 53 completed. The runs used 9,220,259 input tokens, including 7,953,920 cached input tokens, and 147,560 output tokens.

### Evidence and method

The committed, sanitized evidence retains each prompt, observed skill-load event, model output, token use, timeout state, workspace delta, generated artifact, assertion grade, and concise evidence:

- [trigger results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-trigger-results.json), SHA-256 `e99b85f15de344b3099a3432f4f9408fd10bf0e66ceaab75532aed4d68863117`;
- [trigger runner](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/run-trigger-evaluations.mjs), SHA-256 `181cd2761050c56e488e06912056c7864017bbe5ab56f4e35d87bc6a12e89c7d`;
- [output results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-output-results.json), SHA-256 `99086237fd7f0943df1b3a8273a85bf532748e75b932527097ec8c7ceaf800ad`;
- [direct and coordinated comparison](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-review-comparison.json), SHA-256 `2d1be2aeb9b3799e134522676eeb423ed67f8ac9a24ce14069d1729fe51f5660`.
- [Antigravity canary note](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/antigravity-canary.json), SHA-256 `f521622ad936bf76d62292bf630a930c2629e692a0d883cde6af6ee3121425de`.

The versioned trigger runner records its exact invocation, feature disables, status derivation, environment contract, stderr handling, and provenance checks. It counts only successful, completed commands whose output contains the loaded skill's frontmatter, and it runs deterministic classifier and environment self-checks before the campaign. It inventories the target revision; rejects tracked, untracked, and ignored checkout changes under `skills`; requires the isolated installed inventory to equal the 26 target skills; and verifies that every installed entry resolves to the target-matching checkout. It terminates the dedicated child-process group at the timeout with a two-second forced-kill fallback, serializes incremental evidence writes, and sanitizes both logical and resolved temporary paths. The output campaign used an unversioned, one-off Node.js harness with one disposable writable workspace per fixture, three concurrent workers, and a 240-second cap. That output runner remains a reproducibility limitation.

Verify the retained files with:

```sh
shasum -a 256 docs/evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/*.json docs/evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/*.mjs
```

### Codex trigger results

Every trigger case ran three times. `+` means the named skill should load during the turn. `-` means the named skill must not load anywhere in the completed turn. A mixed three-attempt result is `partial`.

Summary: 67 of 77 cases passed, seven were partial, and three failed. Across 231 attempts, 212 passed and 19 failed. No attempt timed out or was blocked. All cases omitted from this table passed. The retained JSON records every attempt, observed skill-load event, and stderr digest.

| Skill | Non-pass cases |
| --- | --- |
| `address-pr-feedback` | `-write-a-single-review-reply` fail (3 `fail`) |
| `automattic-github-enterprise` | `-generic-enterprise-route` partial (2 `pass`, 1 `fail`) |
| `draft-review-comment` | `-address-review-feedback` partial (1 `pass`, 2 `fail`); `+draft-confirmed-findings` partial (2 `pass`, 1 `fail`); `-perform-pr-review` partial (2 `pass`, 1 `fail`); `+prepare-review-document` partial (1 `pass`, 2 `fail`) |
| `iterate-pr-review` | `-iterative-external-review` fail (3 `fail`) |
| `repository-maintenance` | `+verify-github-enterprise-cli-access` fail (3 `fail`) |
| `review-accessibility` | `-general-pull-request-review` partial (1 `pass`, 2 `fail`) |
| `review-test-quality` | `+semantic-ui-regression` partial (2 `pass`, 1 `fail`) |

### Codex output results

Assertion numbers map to each case's ordered `assertions` array in its version-controlled `evals.json`. The committed output evidence retains the assertion text, grade, concise evidence, model output, loaded skills, workspace delta, and 16 generated artifacts. Claims about conditional paths, tool execution, external state, or no mutation are `blocked` when the retained fields cannot prove them.

Summary: 16 of 55 output cases passed, 36 were partial, and three were blocked. Across 194 assertions, 116 passed, four failed, and 74 were blocked. All cases omitted from this table passed. The retained JSON lists every assertion result.

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
| `publish-release` | `ambiguous-publish-target` partial |
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

The four failed assertions are: the `address-pr-feedback` run timed out before returning draft replies; the Enterprise preflight response instructed the user to run its probes instead of executing them outside the sandbox; the publish response did not state that it found the existing local tag; and the current-head iteration output omitted the base revision. The 74 blocked assertions are evidence gaps, not accepted instruction failures.

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
2. An iterative review request for another author's pull request selected `iterate-pr-review` in all three attempts. Follow-up: [#75](https://github.com/ciampo/ai-instructions/issues/75).
3. The Enterprise CLI verification request did not load `repository-maintenance` in all three positive attempts. Follow-up: [#76](https://github.com/ciampo/ai-instructions/issues/76).
4. The chat-only feedback run timed out before it returned the draft replies. Follow-up: [#77](https://github.com/ciampo/ai-instructions/issues/77).
5. The Enterprise preflight response told the user to run the required probes instead of executing them outside the sandbox. Follow-up: [#78](https://github.com/ciampo/ai-instructions/issues/78).
6. The publish response did not state that it found the existing local tag before asking where the tag should point. Follow-up: [#81](https://github.com/ciampo/ai-instructions/issues/81).
7. The current-head iteration output omitted the base revision. Follow-up: [#79](https://github.com/ciampo/ai-instructions/issues/79).
8. Direct and coordinated review assigned materially different severities to the same two findings. Follow-up: [#80](https://github.com/ciampo/ai-instructions/issues/80).

Partial trigger cases are routing gaps, not accepted failures. Follow-ups [#73](https://github.com/ciampo/ai-instructions/issues/73) and [#74](https://github.com/ciampo/ai-instructions/issues/74) cover selected partial routing gaps. Blocked output assertions are evidence gaps. The two timed-out output cases and the unverified Antigravity canary remain verification gaps except for their explicitly retained evidence.

Do not fix these failures in this evidence pull request. Use the focused follow-ups above before changing the evaluated instruction revision.
