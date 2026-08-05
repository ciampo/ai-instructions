# Skill Evaluation Results

Status: partial. The current Codex trigger campaign passed every case and attempt. Output evaluation, the direct-versus-coordinated comparison, and the Antigravity canary remain unverified.

## Purpose

This is the durable ledger for model-backed skill evaluations. Fixture validation proves that cases are complete and self-contained. It does not prove that a client loaded the intended skill or produced the expected result.

Each campaign must record:

- immutable repository and fixture revisions;
- the client, model, inference configuration, authentication context, and tool boundaries;
- at least three attempts for each trigger case;
- output assertions as `pass`, `fail`, or `blocked`, with evidence;
- comparison data when it is material;
- follow-up links for accepted instruction failures.

Static checks or one successful prompt cannot produce a model-backed `pass` result.

## Current trigger campaign

Repository revision: `caa6e7e5e8e65c417a9d02ab69370293edcccf6d`.

Evaluation-fixture revision: `caa6e7e5e8e65c417a9d02ab69370293edcccf6d`.

Prerequisites [#69](https://github.com/ciampo/ai-instructions/pull/69), [#70](https://github.com/ciampo/ai-instructions/pull/70), and [#71](https://github.com/ciampo/ai-instructions/pull/71) are merged in the target revision.

Codex CLI `0.145.0` ran `gpt-5.6-sol` with `xhigh` reasoning on the priority tier. The runner used three concurrent workers and a 90-second attempt timeout. Every attempt received a fresh home, session store, private client state, outside-repository workspace, and exact links to a read-only staged inventory of all 26 target skills.

The runner stages the target with `git archive` before it loads fixtures. It rejects tracked, untracked, or ignored skill-tree changes and records target-tree provenance for every skill. Its narrowed permission profile denies the host home, application roots, non-runtime top-level roots, unrelated temporary roots, and credential-bearing state. Static and real `codex exec` checks verify the boundary. The runner also verifies command classification, retained-evidence sanitization, process cleanup, and effective shell-environment constraints before the campaign.

Positive cases stop after the target skill loads. Negative cases run to completion or timeout and record every observed skill load. The artifact retains sanitized command events and outputs, model messages, timeout state, authentication-boundary evidence, and SHA-256 digests. It contains no pre-sanitization digest.

## Evidence

- [Trigger runner](evaluation-results/caa6e7e5e8e65c417a9d02ab69370293edcccf6d/run-trigger-evaluations.mjs), SHA-256 `bbfedbefd80919fd8c52b45eb4d5af41dd3de08a1bd1699243e9959f4d7d17f9`.
- [Compressed trigger results](evaluation-results/caa6e7e5e8e65c417a9d02ab69370293edcccf6d/codex-trigger-results.json.gz), SHA-256 `8cdeeaf0835b17f865f439a6a83b5dab1feef160d4d9d9aebbf6135cbf7b140e`.
- Decompressed JSON SHA-256 `642d5130e2de45f2280fccebd4e5de04b205cb4a947df9da061988bc9bb6b06a`.

The compressed file is a lossless `gzip -n -9` encoding of the exact JSON produced by the recorded runner invocation. Compression changed no retained evidence.

Verify it with:

```sh
shasum -a 256 docs/evaluation-results/caa6e7e5e8e65c417a9d02ab69370293edcccf6d/codex-trigger-results.json.gz docs/evaluation-results/caa6e7e5e8e65c417a9d02ab69370293edcccf6d/run-trigger-evaluations.mjs
gzip -t docs/evaluation-results/caa6e7e5e8e65c417a9d02ab69370293edcccf6d/codex-trigger-results.json.gz
gzip -cd docs/evaluation-results/caa6e7e5e8e65c417a9d02ab69370293edcccf6d/codex-trigger-results.json.gz | shasum -a 256
```

## Results

All 97 trigger cases passed. Across 291 attempts, all 291 passed, with no failures, blocked attempts, or timeouts. The artifact contains 1,382 completed command events and 558 skill-load events. Every case has attempts 1, 2, and 3. Its complete installed-skill inventory and checkout skill tree match the target revision.

The final campaign confirms the fixes tracked by [#73](https://github.com/ciampo/ai-instructions/issues/73), [#74](https://github.com/ciampo/ai-instructions/issues/74), [#76](https://github.com/ciampo/ai-instructions/issues/76), [#91](https://github.com/ciampo/ai-instructions/issues/91), [#92](https://github.com/ciampo/ai-instructions/issues/92), [#98](https://github.com/ciampo/ai-instructions/issues/98), [#99](https://github.com/ciampo/ai-instructions/issues/99), [#100](https://github.com/ciampo/ai-instructions/issues/100), [#101](https://github.com/ciampo/ai-instructions/issues/101), [#102](https://github.com/ciampo/ai-instructions/issues/102), [#103](https://github.com/ciampo/ai-instructions/issues/103), [#104](https://github.com/ciampo/ai-instructions/issues/104), [#105](https://github.com/ciampo/ai-instructions/issues/105), [#106](https://github.com/ciampo/ai-instructions/issues/106), [#107](https://github.com/ciampo/ai-instructions/issues/107), [#108](https://github.com/ciampo/ai-instructions/issues/108), and [#109](https://github.com/ciampo/ai-instructions/issues/109). Issue bodies preserve superseded campaign snapshots; this ledger is authoritative for the final result.

## Unverified work

The repository does not retain the former output-run, review-comparison, or Antigravity result files. Their one-off execution records lacked a versioned runner, exact inputs, installed-skill provenance, or a complete raw event stream. They cannot support durable result claims.

Output regression fixtures cover immutable pull-request snapshots, explicitly unavailable evidence, and current-checkout identity resolution. Focused runs suggested that the new boundaries work, but those runs did not produce retained, versioned output evidence. Treat them as observations only.

The remaining output campaign, direct-versus-coordinated comparison, and Antigravity canary are outside the scope of PR #72. [Issue #49](https://github.com/ciampo/ai-instructions/issues/49) tracks that verification. Closed issues [#77](https://github.com/ciampo/ai-instructions/issues/77), [#78](https://github.com/ciampo/ai-instructions/issues/78), [#79](https://github.com/ciampo/ai-instructions/issues/79), [#80](https://github.com/ciampo/ai-instructions/issues/80), and [#81](https://github.com/ciampo/ai-instructions/issues/81) record implemented instruction fixes, not retained rerun evidence. Confirm the remaining results with versioned, pinned evidence before accepting any instruction failure or coordinator conclusion.
