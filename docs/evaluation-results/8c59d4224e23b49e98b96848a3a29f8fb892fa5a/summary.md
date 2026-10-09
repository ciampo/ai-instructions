# Screenshot skill evaluation

Original revision `08a081c4d9525d8db2839ec76cc67094d937d660`. Concise revision `8c59d4224e23b49e98b96848a3a29f8fb892fa5a`, skills tree `eefd6602a1bb1ea0fbce2b619c1b3bf1d772120f`.

The skill fell from 825 to 469 words. Independent review found no source defect or lost requirement. The concise version passed all 18 routing attempts, with three repetitions of each positive or negative case. Both versions passed all 17 planned assertions across four output cases. Independent grading verified the entrypoint reads and found no planned regression.

These are routing and decision evaluations. Subjects described intended actions with hypothetical capabilities. Live capture, image inspection, and artifact delivery were not executed. Routing subjects were asked to read applicable entrypoints so selection was observable; negative results mean no screenshot-skill entrypoint read was observed.

Codex CLI `0.162.0` used its default model, without an override. Each subject used a fresh home and workspace with the exact public skill tree staged by `git archive`. A configured filesystem profile denied private files and client credentials, and shell environments excluded client state. Plugins and live browser tools were disabled. The runner did not independently probe that sandbox boundary.

The retained JSON contains sanitized responses, commands, entrypoint contents, exit status, and assertion grades. Authentication and temporary client state were removed. The later evidence commit preserves the evaluated skills tree.

Run from a checkout containing both revisions:

```sh
node docs/evaluation-results/8c59d4224e23b49e98b96848a3a29f8fb892fa5a/run-screenshot-evaluations.mjs "$PWD" 08a081c4d9525d8db2839ec76cc67094d937d660 focused /tmp/screenshot-original.json
node docs/evaluation-results/8c59d4224e23b49e98b96848a3a29f8fb892fa5a/run-screenshot-evaluations.mjs "$PWD" 8c59d4224e23b49e98b96848a3a29f8fb892fa5a full /tmp/screenshot-concise.json
```

Runner SHA-256: `c76df1d0cb8412c2b8894993cc591bb6a790564f9d929142a514b10206af4230`.

- [Original subjects](original-evaluation.json.gz) and [independent grades](original-grades.json.gz)
- [Concise subjects](concise-evaluation.json.gz) and [independent grades](concise-grades.json.gz)
