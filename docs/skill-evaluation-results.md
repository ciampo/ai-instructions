# Skill Evaluation Results

Status: partial. The current Codex trigger campaign passed every selected case and attempt. Eight retained output cases remain partial: seven fixtures cannot exercise required local mutations or remote actions, and one subject violated an explicit load-order rule. The direct-versus-coordinated comparison and Antigravity canary remain unverified.

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

## Current output and trigger campaign

Repository revision: `595ab7cc2a3eafe096f1f643d5d78def7c3595f5`.

Evaluation-fixture revision: `595ab7cc2a3eafe096f1f643d5d78def7c3595f5`.

Base revision: `b3d6ffabec2ee6299a24d8aaab92a13a5725441b` from `main`.

The later evidence commit changes only documentation and retained evaluation artifacts. Its `skills` tree matches the evaluated revision.

Codex CLI `0.145.0` ran `gpt-5.6-sol` with `xhigh` reasoning on the priority tier. Every subject and grader received a fresh home, session store, private client state, and outside-repository workspace. The runners staged the target with `git archive`, rejected skill-tree changes, and retained exact target-tree provenance. Their narrowed permission profiles denied the general host home and credential-bearing state while allowing the system and toolchain roots needed to execute. Retained output can therefore include sanitized runtime inventory such as installed Node versions. The trigger runner retained static and exact `codex exec` boundary checks. The output runner retained the configured denial profile but did not retain an independent exact-exec boundary preflight.

The output artifacts include the complete sanitized raw event stream, command evidence, assertion grades, workspace deltas, timeout state, and SHA-256 digests. The trigger artifacts retain sanitized assistant messages, completed command events, skill-load classifications, timeout state, and SHA-256 digests of the sanitized complete stdout and stderr streams. They do not retain every raw trigger event object. None of the artifacts contain a pre-sanitization digest. The output runner used two concurrent workers, 240-second subject timeouts, 720-second timeouts for the two coordinator workflows, and a 120-second grader timeout. The trigger runner used three concurrent workers, three attempts per case, and a 240-second attempt timeout.

## Evaluation order

Focused output cases ran first. They exposed two instruction gaps:

- `automattic-github-enterprise` could imply that its configured macOS and POSIX preflight applied to unconfigured Windows or PowerShell environments;
- `self-review-pr` did not explicitly request the canonical repository and pull-request identity when every supported evidence route was unavailable.

Each instruction changed in a separate commit. Only affected cases reran while the instructions were changing. All three focused `self-review-pr` output cases passed after the second fix. The full output suite then ran at the exact target revision. Six inconsistent or timed-out cases reran serially; five passed and one remained partial because the runner cannot observe the late coordinator handoff. The full trigger suite ran only after the focused output cases passed.

Independent pull-request review then found that the output sanitizer missed `sender_thread_id` fields and thread-error UUIDs, and that the ledger overstated the trigger event retention and output boundary preflight. The repair rerun also exposed that the output runner did not materialize one adjacent executable fixture corpus. The repaired output runner sanitizes those identifiers, stages the tracked executable corpus with its target-revision tree hash, and reports only its configured permission boundary. A four-case focused gate passed all 15 assertions. The repaired full output suite then ran, followed by a six-case serial affected rerun. Five affected cases passed; one remained partial because the subject read PR context before the required separate `review-simplicity` and `review-coordinator` loads. The trigger suite did not rerun because neither its runner, target skill tree, nor retained results changed.

The archives do not retain wall-clock timestamps or cross-run lineage. The sequence above is the operator-recorded chronology and cannot be reconstructed independently from the result files.

## Results

### Output

The repaired full output run covered all 92 cases and 337 assertions. Its raw result was 79 passed and 13 partial cases. The six-case affected rerun produced five passes and one partial. Replacing those six exact cases with their later results gives the selected outcome: 84 passed and eight partial cases, with 325 passing and 12 failing assertions. No selected assertion is blocked.

Seven partial cases require a writable checkout, simulated remote write, or another mutation capability that their current immutable fixtures do not provide. The subjects stopped and reported the missing route instead of fabricating implementation, verification, commit, push, review-request, or pull-request-update evidence:

- `address-pr-feedback/parent-gated-feedback-loop`;
- `iterate-pr-review/local-only-fix-authority`;
- `iterate-pr-review/copilot-request-surface`;
- `repository-maintenance/open-draft-pr-authority`;
- `repository-maintenance/authored-pr-rebase-authority`;
- `repository-maintenance/authored-pr-no-rebase-plain-force`;
- `write-pr-description/exact-head-evaluation-update`.

The remaining partial case, `review-pr/coordinator-handoff-routing`, produced the expected critical security and major compatibility findings, loaded the mandatory simplicity and coordinator workflows, and returned one deduplicated review. It read the supplied PR context in the same first command that loaded `review-pr`, before loading `review-simplicity` and `review-coordinator` in separate actions. One assertion therefore failed. The skill already prohibits context access before those loads, so the campaign retains the execution failure instead of repeating the rule or reporting the case as passing.

### Triggers

The full trigger run covered all 97 cases and 291 attempts. Its raw result was 290 passes and one failure, with no blocked attempts or timeouts. One `engineering-standards/resume-session` negative attempt loaded `engineering-standards` after the intended `resume-session` workflow; the other two attempts passed. The exact three-attempt affected rerun passed 3 of 3. Replacing that case's earlier attempts gives the selected outcome: all 97 cases and all 291 attempts pass. The complete installed-skill inventory and checkout skill tree match the target revision.

## Evidence

- [Output runner](evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/run-output-evaluations.mjs), SHA-256 `b1a100a157992e489b766b21f889ece7c03ab88ffb734053d3539844b92662e2`.
- [Full output results](evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/codex-output-results.json.gz), compressed SHA-256 `eab7e61802dcd9eebd2c7396aebaec3682f3296ce7785f47536a91c8aeb8559a`; decompressed JSON SHA-256 `cf844b26db3dcca63c63ef2685080d1d742ed9c999907427ad9983c352a751cb`.
- [Affected output rerun](evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/codex-output-affected-rerun.json.gz), compressed SHA-256 `bba8748d13e1e4c95c708291abfda6370c7827abc2b0fc6501a6a0c8f5304a4c`; decompressed JSON SHA-256 `2c0ef8fe23c90f33704bcbc66ba58a7fe92cf133361c27486d26a9c724a3de35`.
- [Focused output results](evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/codex-output-focused-results.json.gz), compressed SHA-256 `fa57e3bac18b36fd268bf111d81dfb7a4b2d678da3c0850751c89a6d426c4d17`; decompressed JSON SHA-256 `36b4c777bd73942fc6f9a1adae2c903d1cb661d845b758fcc689db63dd82d17d`.
- [Trigger runner](evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/run-trigger-evaluations.mjs), SHA-256 `674c72c7fe95ca3fb70f14fa95ca314f4a276b02ae8f083201876d513fb2fbfc`.
- [Full trigger results](evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/codex-trigger-results.json.gz), compressed SHA-256 `04ec2e58ec686a57f7b6ee596eb6c3abf53bf8f9dc8ca04503469c8f789d7c03`; decompressed JSON SHA-256 `91fc5f68fcefe7590b9173ba8f09943c4895570d0d2be2d30ea715a0cda692b7`.
- [Affected trigger rerun](evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/codex-trigger-affected-rerun.json.gz), compressed SHA-256 `ee1fff6a3463d90cf05d8138ddbdf35c26f83d79f2dc99a0064032f124db087f`; decompressed JSON SHA-256 `b28a15890910133e9dc00047777c99dae35351d41f70c25a4c435166e1e0cbb6`.

The result files are lossless `gzip -n -9` encodings of the exact JSON produced by the recorded runner invocations. Compression changed no retained evidence.

Verify them with:

```sh
node docs/evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/run-output-evaluations.mjs --verify-self
node docs/evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/run-trigger-evaluations.mjs --verify-classifier
shasum -a 256 docs/evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/*
gzip -t docs/evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/*.json.gz
for file in docs/evaluation-results/595ab7cc2a3eafe096f1f643d5d78def7c3595f5/*.json.gz; do gzip -cd "$file" | shasum -a 256; done
```

## Unverified work

The direct-versus-coordinated comparison and Antigravity canary remain outside this campaign. [Issue #49](https://github.com/ciampo/ai-instructions/issues/49) continues to track them. Do not infer either result from the retained output or trigger evidence.

The previous all-pass trigger campaign remains retained at revision `caa6e7e5e8e65c417a9d02ab69370293edcccf6d`. [PR #72](https://github.com/ciampo/ai-instructions/pull/72) records its setup and conclusions. This current ledger supersedes that campaign for the changed skill instructions and fixtures.
