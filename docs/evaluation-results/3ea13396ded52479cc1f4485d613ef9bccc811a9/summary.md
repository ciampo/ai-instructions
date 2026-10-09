# Root-cause solution evaluation

Evaluated revision `3ea13396ded52479cc1f4485d613ef9bccc811a9`, skills tree `dc1829c71ad3576392fb42c1d38b7596aded0d37`, on 2026-10-09. Later evidence-only commits preserve this skills tree.

| Campaign | Trigger attempts passed | Output cases passed | Assertions passed |
| --- | --- | --- | --- |
| Focused outputs | Not run | 4/4 | 23/23 |
| Full suite | 15/15 | 4/4 | 23/23 |
| Baseline without this skill | Not run | 3/4 | 22/23 |

The focused run passed before the full suite started. Each full-suite trigger prompt ran three times against the complete 31-skill catalog. Both positive prompts loaded `root-cause-solution` in all attempts. Diagnosis-only, routine-label, and general-PR-review prompts did not load it in any attempt. Successful command outputs provide the entrypoint-read evidence.

The output cases cover same-query request identity, unavailable native focus evidence, retaining a required compatibility guard, and cancellation ownership for a new retry feature. The baseline excludes only `root-cause-solution` and uses the same cases and remaining catalog. It reaches the same correct recommendations. Its single failed assertion is the explicit comparison with leaving the feature runner unchanged. This is a method-coverage difference, not demonstrated improved correctness.

The parent Codex agent graded every assertion from complete responses and completed command traces. No independent grader ran. All focused and full-suite subjects read the target entrypoint, and all subject command traces contain only public instruction and fixture reads. The baseline never read the excluded skill.

## Execution and retention

Codex CLI `0.162.0` used its default model without an override. User configuration was ignored, and the retained events do not identify the actual default model. Three workers ran fresh ephemeral sessions with isolated homes and workspaces. Public skills came from `git archive` at the evaluated revision; fixtures came from `git show` at that same revision. No user instructions, private project data, live apps, plugins, browser tools, memories, or hooks were provided.

Each campaign independently checked the configured sandbox boundary using `codex sandbox`: staged public content was readable, while a synthetic private probe, copied client authentication, and source authentication were unreadable. The model shell received a restricted environment without client state. Temporary client authentication was private to the CLI and removed by the runner's `finally` cleanup. Successful runner exits confirm that cleanup completed.

The retained JSON contains sanitized public prompts, responses, command outputs, events, execution status, timeout status, CLI version, runner hash, and revision provenance. Host home paths, evaluation paths, thread identifiers, and recognizable secret prefixes are redacted. Authentication and temporary client files are not retained. These artifacts do not retain private account configuration or name the default model.

These are routing and recommendation evaluations. Output subjects were explicitly instructed to read the target skill. Trigger subjects selected from the native installed catalog and were instructed to make selection observable through entrypoint reads. Negative results mean no target entrypoint read was observed. No feature implementation, native-browser reproduction, or additional runtime compatibility was executed. Assertions measure this small fixture suite and do not establish a general improvement over the baseline.

## Evidence and reproduction

- [Runner](run-root-cause-evaluations.mjs)
- [Focused results](focused.json.gz)
- [Full results](full.json.gz)
- [Baseline results](baseline.json.gz)
- [Assertion grades](grades.json)

The runner's SHA-256 is `121bdc6c5f770c9c51b53ef28389de93316124a4da24944505b4c1457e0b7de0`. Each result also records this hash. The gzip files contain lossless JSON results.

Run from a checkout containing the evaluated revision:

```sh
node docs/evaluation-results/3ea13396ded52479cc1f4485d613ef9bccc811a9/run-root-cause-evaluations.mjs "$PWD" 3ea13396ded52479cc1f4485d613ef9bccc811a9 focused /tmp/root-cause-focused.json
node docs/evaluation-results/3ea13396ded52479cc1f4485d613ef9bccc811a9/run-root-cause-evaluations.mjs "$PWD" 3ea13396ded52479cc1f4485d613ef9bccc811a9 full /tmp/root-cause-full.json
node docs/evaluation-results/3ea13396ded52479cc1f4485d613ef9bccc811a9/run-root-cause-evaluations.mjs "$PWD" 3ea13396ded52479cc1f4485d613ef9bccc811a9 baseline /tmp/root-cause-baseline.json
```

Grade the outputs against the immutable fixture assertions. The retained grades are judgments about the recorded outputs; the runner does not automate those judgments.
