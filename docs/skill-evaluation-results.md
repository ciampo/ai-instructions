# Skill Evaluation Results

Status: partial overall. The PR #119 cross-skill campaign passed all 12 focused trigger attempts, both focused output cases, and all 15 output assertions. The earlier PR #115 review-prose campaign passed every output case tied to the changed workflow bodies or API-design boundary fix and all 103 selected trigger cases across 309 attempts. Seven of 99 selected output cases remain partial because six immutable fixtures cannot perform required mutations and one unchanged workflow selected the wrong task-title purpose. A later paired accessibility comparison passed 3 of 3 attempts on both exact trunk and the pull-request revision. Copilot review was deferred at the user's request. The direct-versus-coordinated comparison and Antigravity canary remain unverified.

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

## PR #119 unslop cross-skill campaign

Repository revision: `a0328fbafd28cb604de52e2a6fd50300a8b843b2`.

Evaluation-fixture revision: `a0328fbafd28cb604de52e2a6fd50300a8b843b2`.

Base revision: `a5f7e09954e2ee4b0054fa26aca80193d83055a1` from `main`.

The later evidence commit changes only documentation and retained evaluation artifacts. Its `skills` tree matches the evaluated revision. The target `skills` tree is `197ef404e8ec6694abd422d2f4ed999e94460e8f`.

Codex CLI `0.145.0` ran `gpt-5.6-sol` with `xhigh` reasoning on the priority tier. Every subject, grader, and trigger attempt used a fresh isolated home and outside-repository workspace. The runners staged the immutable target with `git archive`, rejected skill-tree changes, and retained sanitized command and event evidence with exact target-tree provenance. The trigger runner retained an independent exact-exec boundary preflight. The output runner retained its configured denial profile but not an independent exact-exec boundary preflight.

### Results

The focused trigger run covered the shared pull-request-description and review prompts under both expected skills. All 12 target classifications passed across three attempts per fixture case.

The three `write-pr-description/draft-description` attempts loaded both `write-pr-description` and `unslop`. The three `review-pr/review-a-shared-pr` attempts loaded both `review-pr` and `unslop`. The mirrored `unslop/pr-review-cross-skill` attempts also loaded both skills. Two of three mirrored `unslop/pr-description-cross-skill` attempts loaded both skills; the remaining attempt stopped when the target `unslop` skill loaded, as required by the positive-case early-stop rule, before later loads could be observed. The complete owning-skill attempts provide the co-activation evidence for both shared prompts.

The focused output run passed both cases and all 15 assertions. `write-pr-description/behavior-first-local-draft` loaded `write-pr-description` and `unslop`, then passed all six artifact and prose assertions. `review-pr/read-only-synthesized-review` loaded `review-pr`, `unslop`, and its required review workflows, then passed all nine assertions. No case or assertion failed, remained partial, or was blocked.

This campaign proves co-activation and the combined output contracts for the two selected workflows. It does not isolate how much `unslop` changed the prose because no previous-revision or no-skill baseline ran.

### Evidence

- [Output runner](evaluation-results/a0328fbafd28cb604de52e2a6fd50300a8b843b2/run-output-evaluations.mjs), SHA-256 `df1640f239c72e30bb3e42168bdfb9b6cfcebbcac560ba0593c04c52e6adb9fe`.
- [Focused output results](evaluation-results/a0328fbafd28cb604de52e2a6fd50300a8b843b2/codex-output-cross-skill-results.json.gz), compressed SHA-256 `c8fa64e0d2c566933b8798ad8a57a7e88e367531509952c1c11bb370d9033a7f`; decompressed JSON SHA-256 `3d7ef0766f0c84b91bc69d749e769c4ce4a607f07b1ab9cc519fc8bc841bc26f`.
- [Trigger runner](evaluation-results/a0328fbafd28cb604de52e2a6fd50300a8b843b2/run-trigger-evaluations.mjs), SHA-256 `3764c97497e780f4329e9724f8671a48079a5d21beffedc681ba3224aaa7541a`.
- [Focused trigger results](evaluation-results/a0328fbafd28cb604de52e2a6fd50300a8b843b2/codex-trigger-cross-skill-results.json.gz), compressed SHA-256 `cc02969c4aeca5088d97b58edc97d3871074c476e02477c48352a6ad82b083a3`; decompressed JSON SHA-256 `3ac3c2d3f05b32bd750e9c11c58cf26784f11d50a10dc984318d0b298bb54e9a`.

The result files are lossless `gzip -n -9` encodings of the exact JSON produced by the recorded runner invocations. Compression changed no retained evidence.

Verify them with:

```sh
node docs/evaluation-results/a0328fbafd28cb604de52e2a6fd50300a8b843b2/run-output-evaluations.mjs --verify-self
node docs/evaluation-results/a0328fbafd28cb604de52e2a6fd50300a8b843b2/run-trigger-evaluations.mjs --verify-classifier
shasum -a 256 docs/evaluation-results/a0328fbafd28cb604de52e2a6fd50300a8b843b2/*
gzip -t docs/evaluation-results/a0328fbafd28cb604de52e2a6fd50300a8b843b2/*.json.gz
for file in docs/evaluation-results/a0328fbafd28cb604de52e2a6fd50300a8b843b2/*.json.gz; do gzip -cd "$file" | shasum -a 256; done
```

## PR #115 review-prose campaign

Repository revision: `4c683c3fab5f045e88a56f4883c19a7e27bf2e62`.

Evaluation-fixture revision: `4c683c3fab5f045e88a56f4883c19a7e27bf2e62`.

Base revision: `a97b4cc6897584184e72a194c8b85f24ccde5dcc` from `main`.

The later evidence commit changes only documentation and retained evaluation artifacts. Its `skills` tree matches the evaluated revision.

Codex CLI `0.145.0` ran `gpt-5.6-sol` with `xhigh` reasoning on the priority tier. Every subject, grader, and trigger attempt used a fresh isolated home and outside-repository workspace. The runners staged the immutable target with `git archive`, rejected skill-tree changes, and retained sanitized command and event evidence with exact target-tree provenance. The target `skills` tree is `ff3ba5d0f1ee7dcd6f6a7e3a3f5c3a0a519635e8`. The trigger runner retained an independent exact-exec boundary preflight. The output runner retained its configured denial profile but not an independent exact-exec preflight.

### Evaluation order

Independent self-review found that the simplified `review-api-design` description no longer explicitly excluded public API implementation requests. The accepted fix restored that boundary and added the `review-api-design/public-api-implementation` negative trigger fixture. A second independent review found no actionable feedback at the recorded exact revision.

The focused trigger gate covered ten cases and passed all 30 attempts. The focused output gate covered eight cases and 30 assertions. Its raw result was four passing and four partial cases, with 25 passing, two failing, and three blocked assertions. The four affected review-routing cases then reran serially and passed all 16 assertions. Replacing those exact cases gives the selected focused outcome: all eight cases and all 30 assertions pass.

The full output suite covered 99 cases and 362 assertions. Its raw result was 86 passing and 13 partial cases, with 347 passing and 15 failing assertions and no blocked assertions. Seven inconsistent cases reran serially. Five passed. `review-accessibility/source-proven-read-only-finding` retained one failing assertion, and `repository-maintenance/github-issue-to-authored-pr-transition` retained one failing assertion. Replacing those exact cases initially gave 91 passing and eight partial cases, with 353 passing and nine failing assertions.

Because the accessibility result differed from the earlier retained campaign, a later paired comparison ran the same case three times against exact trunk `a97b4cc6897584184e72a194c8b85f24ccde5dcc` and the pull-request source revision. Both revisions passed 3 of 3 attempts and all nine assertions per revision, for 18 of 18 combined. The fixture context SHA-256 was `92c21dd060ab4852536f557c9661e23eb875351f6278bc0c145ffcd1d2efadbd` for every attempt. The two runners are identical except for the immutable target revision. The concordant pull-request attempts supersede the earlier single partial, and the case is counted once in the selected suite. The final selected outcome is 92 passing and seven partial cases, with 354 passing and eight failing assertions. This paired sample does not show an accessibility regression. Every output case tied to the changed workflow bodies or API-design boundary fix passes.

Six partial cases require a writable checkout, simulated remote write, or another mutation capability that their immutable fixtures do not provide:

- `address-pr-feedback/parent-gated-feedback-loop`;
- `iterate-pr-review/copilot-request-surface`;
- `repository-maintenance/open-draft-pr-authority`;
- `repository-maintenance/authored-pr-rebase-authority`;
- `repository-maintenance/authored-pr-no-rebase-plain-force`;
- `write-pr-description/exact-head-evaluation-update`.

The `repository-maintenance/github-issue-to-authored-pr-transition` subject used the issue-triage purpose emoji instead of the required authored-pull-request purpose emoji. This unchanged workflow is unrelated to the review-prose changes.

The full trigger suite covered 103 cases and 309 attempts. Its raw result was 308 passes and one failure: one `draft-review-comment/perform-pr-review` negative attempt loaded `draft-review-comment` only after `review-pr` stopped because the fixture did not supply pull-request context. The other two raw attempts passed. The exact three-attempt affected rerun passed 3 of 3. Replacing that case's earlier attempts gives the selected outcome: all 103 cases and all 309 attempts pass. The new public API implementation exclusion passes 3 of 3.

Copilot review was intentionally deferred at the user's request. Do not infer a complete `iterate-pr-review` cycle from the self-review and evaluation results alone.

### Evidence

- [Output runner](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/run-output-evaluations.mjs), SHA-256 `7fd8d79b10a4b80c7e1ba0f01f51f66ffbb7128a55e7986a590b95e005b9fed3`.
- [Focused output results](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-focused-results.json.gz), compressed SHA-256 `ee40583c4f97f425a47457fe62e69244c1f7370f73c619999b9c58b1a9db979f`; decompressed JSON SHA-256 `3f5510ab82778e865f4284b90a95f2f3800f650be5513eeedbf8cbf1e8621275`.
- [Focused output rerun](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-focused-rerun.json.gz), compressed SHA-256 `7e6c964ab04137261139909c886c47f1c108859ae14e3832faf9176e724a4635`; decompressed JSON SHA-256 `4d6efdca0eaea3e5564aed19b4163275b2cd2718ed122642572f93ad21fc975d`.
- [Full output results](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-results.json.gz), compressed SHA-256 `1278a68e65185fd45c50a13480a4cd6a6c16a708264d4aaa2186ae67d5d96977`; decompressed JSON SHA-256 `45cb55ba25854fbde431621e78e75cdd778ff50bdd439ee361342ee1ddf487ee`.
- [Affected output rerun](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-affected-rerun.json.gz), compressed SHA-256 `6a747b06637f10f43ef4500999cbc84923e6c45ba575eeaeba244eca63c554d5`; decompressed JSON SHA-256 `fc3ccf31f5fbc63a1e8cde024cb0c44c91230455d7e1c8363965d9c3ecf03f49`.
- [Trunk comparison runner](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/run-output-trunk-comparison.mjs), SHA-256 `69510a4ce1f7f90bf9a659d3b68c0bc938a6bf582229e0c42eea9f8da556b62c`.
- [Pull-request accessibility attempt 1](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-accessibility-pr-attempt-1.json.gz), compressed SHA-256 `27b10cc31a6ffa557771bd2d82f6a8c6b977f16da152c04ce7dc940f76dbb9f9`; decompressed JSON SHA-256 `42dcda06a294ced63603c952a9a23a385a5243b7ef04be827bfc544808fd2722`.
- [Pull-request accessibility attempt 2](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-accessibility-pr-attempt-2.json.gz), compressed SHA-256 `a99b1d6243e0dc41efe1e542efcae1f1860fdd0d1ce8a3b2bcb06a15300dbbec`; decompressed JSON SHA-256 `669fa175b0ee0a8b9da1023ec86bbeea3b0b4a6c404c6a9bdf02459fefe57761`.
- [Pull-request accessibility attempt 3](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-accessibility-pr-attempt-3.json.gz), compressed SHA-256 `195e4f2d00a3f9f0ff8889d4e982b697ea9bc45ccae668dc2165f6e4dbe2d38d`; decompressed JSON SHA-256 `3d9d91d9f5cbd2619b0999330c52aa3cc7704cd2894f57ff81a40714fd3b6604`.
- [Trunk accessibility attempt 1](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-accessibility-trunk-attempt-1.json.gz), compressed SHA-256 `34de013c8c737f58315ee0a2d901ae21ba783d90aca8d9a0783a242b7b63ef6c`; decompressed JSON SHA-256 `cd846b907c8cb49df280382d73af83cae82eee9dc2bcb0cb3e87e82662e8f990`.
- [Trunk accessibility attempt 2](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-accessibility-trunk-attempt-2.json.gz), compressed SHA-256 `17a0ee139a047331adecabeccc8688ea7aa53683e8965134cc056a2fda26648a`; decompressed JSON SHA-256 `4c74fd95e652afcee1871ca102e4bfd909bdfd9a88c8ec4de709199baa2b6aba`.
- [Trunk accessibility attempt 3](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-output-accessibility-trunk-attempt-3.json.gz), compressed SHA-256 `bc7ce53964d45b851bee8c968fadc5e63631283df81cb5d7bc204cecc28e1a3b`; decompressed JSON SHA-256 `bcf90b52aa693ca533a98d89e4e5d558350d10c909e0511a2b555bfb5bcb2d27`.
- [Trigger runner](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/run-trigger-evaluations.mjs), SHA-256 `dfe1d5868a4c19ccd4568a2725389e5f14328f70bdb202db4025b186536b714a`.
- [Focused trigger results](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-trigger-focused-results.json.gz), compressed SHA-256 `75a8b6dc59660a30adf5799b8c8b320896f64cde2414f0d89f7bac95c56a29a5`; decompressed JSON SHA-256 `fb68527d3aed618a5217a7410f26560060eae0babe534ad1954ab2f13c679775`.
- [Full trigger results](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-trigger-results.json.gz), compressed SHA-256 `58b21f065f37e4bfa40c7e1abae1455777856f24e46a575e98b24bab4a33d44f`; decompressed JSON SHA-256 `bb4fb42be37d843fc2b6ad45c1c17902aa1d27e13d4bd0d7893206169311f333`.
- [Affected trigger rerun](evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/codex-trigger-affected-rerun.json.gz), compressed SHA-256 `43fd3d77148d8dda09f157a3d7730fbc5d5ddb11b06a10aa5dd1d20fd7f56235`; decompressed JSON SHA-256 `632d553fb5ccaedc8910d56a3fe470c81ed1e1cf7d172024d371bce615060cc2`.

The result files are lossless `gzip -n -9` encodings of the exact JSON produced by the recorded runner invocations. Compression changed no retained evidence.

Verify them with:

```sh
node docs/evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/run-output-evaluations.mjs --verify-self
node docs/evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/run-output-trunk-comparison.mjs --verify-self
node docs/evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/run-trigger-evaluations.mjs --verify-classifier
shasum -a 256 docs/evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/*
gzip -t docs/evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/*.json.gz
for file in docs/evaluation-results/4c683c3fab5f045e88a56f4883c19a7e27bf2e62/*.json.gz; do gzip -cd "$file" | shasum -a 256; done
```

## PR #112 task-title campaign

Repository revision: `d16b2016a880c530041ce00a30b9a438cb1d45f8`.

Evaluation-fixture revision: `d16b2016a880c530041ce00a30b9a438cb1d45f8`.

Base revision: `d5c55cf780037f8dced2314a9d5f63140c42e1d1` from `main`.

The later evidence commit changes only documentation and retained evaluation artifacts. Its `skills` tree matches the evaluated revision.

Codex CLI `0.145.0` ran `gpt-5.6-sol` with `xhigh` reasoning on the priority tier. Every subject, grader, and trigger attempt used a fresh isolated home and outside-repository workspace. The runners staged the immutable target with `git archive`, rejected skill-tree changes, and retained sanitized command and event evidence with exact target-tree provenance. The trigger runner retained an independent exact-exec boundary preflight. The output runner retained its configured denial profile but not an independent exact-exec preflight.

### Evaluation order

A nine-case focused title run at the preceding revision exposed one self-contained skill gap and two assertion overconstraints. The repository skill omitted the universal rule that co-equal tasks use a batch subject instead of listing every reference. Two assertions also required fixed emoji even though the policy requires an intuitive purpose emoji. The instruction and assertions changed in one commit. The three affected cases then passed all 11 assertions at the recorded exact revision.

The full output suite ran only after the affected gate passed. It covered 99 cases and 362 assertions. Its original runner recorded 90 passing and nine partial cases, with 349 passing and 13 failing assertions and no blocked assertions. All nine task-title cases passed, including canonical issue and pull-request naming, unavailable-metadata behavior, issue-to-authored-PR and co-equal transitions, and stable review and authoring continuation.

Final independent review found that the original output runner could report `pass` when every assertion passed even if the subject timed out before completing. The retained `iterate-pr-review/owned-external-local-authority` subject had timed out, but the raw full result counted it as passing. The repaired runner requires a completed, zero-exit, unsignaled subject before allowing `pass` and includes a deterministic self-check for this boundary. Its exact affected rerun retained the case as partial, with one passing and two failing assertions. Replacing that exact case gives the selected outcome: 89 passing and ten partial cases, with 347 passing and 15 failing assertions. No selected assertion is blocked.

Seven partial cases require a writable checkout, simulated remote write, or another mutation capability that their immutable fixtures do not provide:

- `address-pr-feedback/parent-gated-feedback-loop`;
- `iterate-pr-review/local-only-fix-authority`;
- `iterate-pr-review/copilot-request-surface`;
- `repository-maintenance/open-draft-pr-authority`;
- `repository-maintenance/authored-pr-rebase-authority`;
- `repository-maintenance/authored-pr-no-rebase-plain-force`;
- `write-pr-description/exact-head-evaluation-update`.

The additional `iterate-pr-review/owned-external-local-authority` case is partial because its subject timed out before it completed verification and reported the unpublished local state.

The final two partial cases, `review-pr/explicit-panel-coordinator-handoff` and `review-pr/late-discovered-coordinator-handoff`, accessed supplied pull-request context before separately loading the required review workflows. The retained results preserve those existing load-order failures instead of reporting them as passes.

The full trigger suite covered 102 cases and 306 attempts. Its raw result was 305 passes and one failure: one `review-simplicity/implementation-request` negative attempt loaded the excluded review-only skill before recognizing the boundary. The exact three-attempt affected rerun passed 3 of 3. Replacing that case's earlier attempts gives the selected outcome: all 102 cases and all 306 attempts pass.

### Evidence

- [Original output runner](evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/run-output-evaluations-original.mjs), SHA-256 `ecb96fa57d4104efa47e5e75d5a4850ab22f16a1b4bd4afc766a297f95082a8b`.
- [Repaired output runner](evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/run-output-evaluations.mjs), SHA-256 `e5d48fdb3a2d102b7149ef375321aa028e99f45aa473c489e7de7d8533e39ff3`.
- [Affected output rerun](evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/codex-output-affected-rerun.json.gz), compressed SHA-256 `7f151aea3bae0ba2a8829407a78ea7e6a7209bf3c3ab21358a387971d487c5fc`; decompressed JSON SHA-256 `22d8679480b64852acd8b2851c6c947c87cb33bd8ad917acc0deafe82131f9be`.
- [Full output results](evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/codex-output-results.json.gz), compressed SHA-256 `5a0c69be58e6a160371e8db542f3b2cd5d1f6f11e54baa20b7951b7c2e69200d`; decompressed JSON SHA-256 `15393089fc263a999417cae4981cf6cb3afd4ca2e6b6b67eda4494f4d290c4f8`.
- [Timed-out output rerun](evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/codex-output-timeout-rerun.json.gz), compressed SHA-256 `f044f5d23b488722ff0ffb858ee4dbc258fecd6ffaeaaad850430d28c9059001`; decompressed JSON SHA-256 `108e1cea8f4660f107baf6a7dec7c712276305fece96b551170ebf57c25e6207`.
- [Trigger runner](evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/run-trigger-evaluations.mjs), SHA-256 `e40bc6a761e6821cc67e139901de1c2ab3e9435ed2c3d70dcfbe1dc30a519707`.
- [Affected trigger rerun](evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/codex-trigger-affected-rerun.json.gz), compressed SHA-256 `227f45994974581647145b128b730ed72b984d9d35e4774add1c958731e76e8d`; decompressed JSON SHA-256 `d1102e809f87c4c53f78fd646b1c536dfa7fbb4d51c589a7668d00e83d7a7854`.
- [Full trigger results](evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/codex-trigger-results.json.gz), compressed SHA-256 `58c58fdd19aae82c64de0a7992153045ff0eadef375ab3dea4c3d4c1fb79a6e8`; decompressed JSON SHA-256 `4f2f08ad5c29c73bd5d3bfd0a7b338f6809482685e79cfa86c5d65e95a43fd5e`.

The result files are lossless `gzip -n -9` encodings of the exact JSON produced by the recorded runner invocations. Compression changed no retained evidence.

Verify them with:

```sh
node docs/evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/run-output-evaluations.mjs --verify-self
node docs/evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/run-output-evaluations-original.mjs --verify-self
node docs/evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/run-trigger-evaluations.mjs --verify-classifier
shasum -a 256 docs/evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/*
gzip -t docs/evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/*.json.gz
for file in docs/evaluation-results/d16b2016a880c530041ce00a30b9a438cb1d45f8/*.json.gz; do gzip -cd "$file" | shasum -a 256; done
```

## Previous output and trigger campaign

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
