# Feature map contract

Keep the map inside the generated verification skill. It records user or consumer paths and observable proof, rather than duplicating implementation documentation.

## Index

`features/README.md` identifies the project, common prerequisites, baseline test data, driving conventions, and evidence location. Link every feature file once. State which features and entry points are mapped and any known omissions. A partial starting map is acceptable when labeled accurately.

## Feature files

Each file starts with a feature title and a short description of its observable behavior. Use these sections:

- `Sub-features`: stable IDs and the behavior each covers.
- `How to get to it`: supported UI, CLI, service, or public API entry points from the user's or consumer's perspective.
- `Driving it`: prerequisites, exact actions through the available harness, and an observable expected result for each action. Name the harness here when useful.
- `Gotchas`: required permissions or seed data, state reset needs, timing conditions, and known limits of the proof.

For a persistent mutation, include a second public read that proves the stored result. For a failure path, assert its output and relevant absence of side effects. Record alternate entry points separately; proving a CLI path does not also prove a browser path.

## Evidence and coverage

Each proof records the feature ID, entry point, action, expected result, observed result, and artifact path. UI evidence may include semantic snapshots and screenshots. CLI evidence includes the command, stdout, stderr, and exit status. Service and library evidence includes public inputs, outputs, and relevant persisted effects.

Keep proof artifacts outside disposable data so cleanup cannot remove them. Report unreachable paths with the route attempted and concrete missing prerequisite. A skipped or unreachable path is not verified behavior. Generated recipes must contain actual project commands and handles, without unresolved placeholders or invented tools.

<!-- Adapted from https://github.com/cursor/plugins/tree/c49b37a2c0e7bede60a71ad7322e3f12c337a3da/pstack/skills/create-verification-skill/references/feature-map-example. MIT licensed; see ../LICENSE. -->
