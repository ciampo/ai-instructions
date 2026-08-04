# Skill Evaluation Results

Status: partial. The Codex trigger campaign completed with confirmed routing gaps. The historical Codex output and comparison records remain unverified because they lack a versioned runner and pinned installed-skill provenance. The Antigravity canary is also unverified.

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
| Codex CLI `0.145.0` trigger campaign | `gpt-5.6-sol`, `xhigh`, priority tier; macOS `26.5.2` arm64 | Fresh home, private client state, and workspace per attempt; split filesystem permissions deny the model shell access to host home, shared temporary roots, and client state; explicit client and model-shell environment allowlists; isolated login-shell profiles; exact read-only target-revision skill stage; three concurrent workers; public fixtures | partial |
| Codex CLI `0.145.0` output campaign and review comparison | Same reported model and host | Unversioned one-off output harness; comparison runner and exact per-run inputs absent; installed-skill provenance absent | unverified |
| Google Antigravity CLI `1.1.6` | Reported Gemini 3.6 Flash (High); macOS `26.5.2` arm64 | Reported authenticated profile, plan mode, and sandbox; permission settings, safety state, and raw event stream unverified | blocked, unverified |

The isolated Codex trigger rerun materialized the target revision's skills with `git archive` before workers started and made that stage read-only. Every attempt received a fresh outside-repository workspace and home, exact links to the staged 26-skill inventory, and private client state in a separate temporary root. The client process used the private authentication copy, but a tested split filesystem permission profile denied the model shell access to that state, the source host home, and shared temporary roots. The profile allowed the model shell to read only the attempt root and isolated target stage within those denied roots. The client process inherited neither the host environment nor the host home directory. Its environment contained only `CODEX_HOME`, `HOME`, `LANG`, `LC_ALL`, `NO_COLOR`, `PATH`, `SHELL`, `TERM`, `TMPDIR`, and `ZDOTDIR`. Model-created command shells inherited no client variables and received the same allowlist without `CODEX_HOME`. Isolated zsh profiles reset `PATH` after system login profiles run, and the preflight executes `/bin/zsh -lc` to require the recorded value. The runner disabled user configuration, rules, plugins, apps, browser and computer control, memory, hooks, remote plugins, and multi-agent tools. Positive cases stopped after the target skill loaded. Negative cases ran to turn completion or the 90-second timeout and recorded every completed command and observed skill load. Every completed command retains its sanitized command, output, exit code, loaded-skill derivation, original output SHA-256, and retained-output SHA-256. The runner also retained full stdout and stderr stream digests, a sanitized stderr preview, and atomic incremental evidence snapshots for every attempt. Signal handlers stop active detached process groups, await attempt cleanup, and preserve the last complete snapshot. Host system files outside the denied host home and shared temporary roots remain readable; this is a host-dependence limitation.

The historical Codex output runs used one disposable workspace per case and a 240-second cap. Of 55 cases, 53 completed. The runs used 9,220,259 input tokens, including 7,953,920 cached input tokens, and 147,560 output tokens. These records do not prove which installed skill trees or exact runner produced them.

### Evidence and method

The committed trigger evidence retains each prompt, completed command event, observed skill-load event, model message, authentication boundary, timeout state, and stdout and stderr digests. The historical artifacts retain output text, grading fields, token use, workspace deltas, and generated artifacts, subject to the unverified limitations below:

- [trigger results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-trigger-results.json), SHA-256 `0d832ac320e0002291613bbb717a777349f7740c1057c8e9851cfcf2f68378f9`;
- [trigger runner](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/run-trigger-evaluations.mjs), SHA-256 `442b5e951e5121371bd46ad495a449396dbcd713d1173831bc673fb2bd38aaa8`;
- [output results](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-output-results.json), SHA-256 `99086237fd7f0943df1b3a8273a85bf532748e75b932527097ec8c7ceaf800ad`;
- [direct and coordinated comparison](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/codex-review-comparison.json), SHA-256 `2d1be2aeb9b3799e134522676eeb423ed67f8ac9a24ce14069d1729fe51f5660`.
- [Antigravity canary note](evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/antigravity-canary.json), SHA-256 `f521622ad936bf76d62292bf630a930c2629e692a0d883cde6af6ee3121425de`.

The versioned trigger runner records its sanitized exact argument vector, feature disables, status derivation, authentication boundary, environment contract, command evidence, stream handling, and provenance checks. It counts only successful, completed commands whose output contains the loaded skill's frontmatter, and it runs deterministic classifier, skill-detector, sanitizer, actual login-shell environment, and filesystem-boundary self-checks before the campaign. The classifier and environment checks do not require a model run. The runner inventories the target revision; rejects tracked, untracked, and ignored checkout changes under `skills`; stages the target-revision tree before workers start; requires every per-attempt installed inventory to equal the 26 target skills; and gives each attempt fresh user and client state. It terminates the dedicated child-process group at the timeout with a two-second forced-kill fallback, handles runner interruption with process-group and temporary-root cleanup, writes incremental evidence through same-directory atomic renames, and sanitizes logical and resolved temporary roots in longest-first order.

The output campaign used an unversioned, one-off Node.js harness, and the direct-versus-coordinated comparison retained neither a runner nor its exact prompts and setup. Neither artifact records installed-skill tree provenance. Their grades and comparison are preserved as unverified observations, not verified results.

Verify the retained files with:

```sh
shasum -a 256 docs/evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/*.json docs/evaluation-results/561a88a0b1adcfadfed2b08f2efe195436341d1a/*.mjs
```

### Codex trigger results

Every trigger case ran three times. `+` means the named skill should load during the turn. `-` means the named skill must not load anywhere in the completed turn. A mixed three-attempt result is `partial`.

Summary: 66 of 77 cases passed, five were partial, and six failed. Across 231 attempts, 206 passed, 24 failed, and one was blocked. The blocked negative-control attempt timed out after 90 seconds before turn completion; its other two repetitions passed. All cases omitted from this table passed. The retained JSON records every attempt, completed command event and output, observed skill-load event, authentication boundary, timeout state, and stdout and stderr digest.

| Skill | Non-pass cases |
| --- | --- |
| `address-pr-feedback` | `-write-a-single-review-reply` fail (3 `fail`) |
| `automattic-github-enterprise` | `-generic-enterprise-route` fail (3 `fail`) |
| `draft-review-comment` | `-address-review-feedback` fail (3 `fail`); `-perform-pr-review` partial (1 `pass`, 2 `fail`) |
| `engineering-standards` | `+scoped-code-review` partial (2 `pass`, 1 `fail`) |
| `iterate-pr-review` | `-iterative-external-review` fail (3 `fail`) |
| `repository-maintenance` | `+verify-github-enterprise-cli-access` fail (3 `fail`) |
| `review-accessibility` | `-general-pull-request-review` partial (1 `pass`, 2 `fail`) |
| `review-coordinator` | `+implicit-multi-lane-review` partial (2 `pass`, 1 `fail`) |
| `review-pr` | `+multi-lane-pr-review` fail (3 `fail`) |
| `self-review-pr` | `-review-another-authors-pr` partial (2 `pass`, 1 `blocked`) |

### Codex output observations (unverified)

Assertion numbers map to each case's ordered `assertions` array in its version-controlled `evals.json`. The committed output evidence retains the assertion text, grade, concise evidence, model output, loaded skills, workspace delta, and 16 generated artifacts. Claims about conditional paths, tool execution, external state, or no mutation are `blocked` when the retained fields cannot prove them.

Historical grading summary: 16 of 55 output cases passed, 36 were partial, and three were blocked. Across 194 assertions, 116 passed, four failed, and 74 were blocked. All cases omitted from this table were graded pass. The retained JSON lists every assertion observation, but the missing runner and installed-skill provenance prevent verified campaign status.

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

The four observed failed assertions are: the `address-pr-feedback` run timed out before returning draft replies; the Enterprise preflight response instructed the user to run its probes instead of executing them outside the sandbox; the publish response did not state that it found the existing local tag; and the current-head iteration output omitted the base revision. The 74 blocked assertions are evidence gaps. None of these observations is an accepted instruction failure until a versioned, pinned rerun confirms it.

### Direct and coordinated review comparison (unverified)

The record identifies `skills/review-pr/evals/fixtures/coordinator-handoff-routing.md` from the target revision. Both outputs found the same authorization and persisted-state problems, with no duplicate or false-positive finding, and their severity normalization differed. The artifact does not retain the runner, exact prompts and setup, or installed-skill provenance, so the comparison is unverified.

| Path | Findings | Severity | Wall time | Tokens |
| --- | --- | --- | --- | --- |
| Direct `review-pr` | Missing object-level deletion authorization; missing persisted-preference migration | `critical`, `major` | 86.853 seconds | 308,725 input, 277,760 cached input, 4,129 output |
| `review-coordinator` | Same two findings | `major`, `minor` | 110.037 seconds | 586,586 input, 548,352 cached input, 4,691 output |

The coordinated path reportedly took 23.184 seconds longer and used 277,861 more input tokens. The lower severities are an unverified normalization observation, not an accepted instruction failure.

### Antigravity canary

The `review-accessibility/no-artifact-delivery` canary is reported blocked, but its historical result is unverified. The run reportedly auto-denied `read_file` in headless plan mode because it could not present an approval prompt. It also reportedly produced no model response, review artifact, source change, or remote change. The campaign did not retain the raw event stream or a filesystem delta, so those observations cannot be audited. The historical note reports that the invocation did not use `--dangerously-skip-permissions` or change the user's permission settings, but that safety state is also unverified.

### Accepted failures and follow-ups

The accepted instruction failures from the verified trigger campaign are:

1. A single review-reply request selected `address-pr-feedback` instead of `draft-review-comment` in all three attempts. Follow-up: [#73](https://github.com/ciampo/ai-instructions/issues/73).
2. A generic GitHub Enterprise request selected `automattic-github-enterprise` in all three negative attempts. Follow-up: [#74](https://github.com/ciampo/ai-instructions/issues/74).
3. An address-feedback request selected `draft-review-comment` in all three negative attempts. Follow-up: [#73](https://github.com/ciampo/ai-instructions/issues/73).
4. An iterative review request for another author's pull request selected `iterate-pr-review` in all three attempts. Follow-up: [#75](https://github.com/ciampo/ai-instructions/issues/75).
5. The Enterprise CLI verification request did not load `repository-maintenance` in all three positive attempts. Follow-up: [#76](https://github.com/ciampo/ai-instructions/issues/76).
6. A multi-lane pull-request review loaded `review-coordinator` directly but skipped the intended `review-pr` entry workflow in all three attempts. Follow-up: [#92](https://github.com/ciampo/ai-instructions/issues/92).

Partial trigger cases are routing gaps, not accepted failures. Follow-ups [#73](https://github.com/ciampo/ai-instructions/issues/73) and [#91](https://github.com/ciampo/ai-instructions/issues/91) cover selected partial routing gaps. The blocked trigger attempt and blocked output assertions are evidence gaps. The two timed-out output cases and the unverified Antigravity canary remain verification gaps except for their explicitly retained evidence.

The unverified output and comparison observations have provisional follow-ups [#77](https://github.com/ciampo/ai-instructions/issues/77), [#78](https://github.com/ciampo/ai-instructions/issues/78), [#79](https://github.com/ciampo/ai-instructions/issues/79), [#80](https://github.com/ciampo/ai-instructions/issues/80), and [#81](https://github.com/ciampo/ai-instructions/issues/81). Confirm them with a versioned, pinned runner before treating them as accepted instruction failures.

Do not fix these failures in this evidence pull request. Use the focused follow-ups above before changing the evaluated instruction revision.
