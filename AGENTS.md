# ai-instructions

This repository is the source for personal agent instructions and Agent Skills. An installer copies or links them into each product's configuration. This file guides work on the repository itself. It is not distributed.

## Layout

- `instructions/core.md` is the always-on core that the installer distributes. It must stay product-neutral and within 150 lines and 8 KB.
- `skills/<name>/` holds one self-contained Agent Skill: `SKILL.md`, optional `references/`, and `evals/evals.json` with its fixtures.
- `platforms/manifest.json` and `scripts/` drive the installer. `tests/` covers it.
- `scripts/evals/` holds the shared evaluation runners. Do not commit runners, transcripts, or result archives; record campaign summaries in `docs/skill-evaluation-results.md`.
- `docs/decisions/` records architecture decisions. Read [CONVENTIONS.md](CONVENTIONS.md) before changing instructions or skills.

## Verify

Run these before you commit. CI runs the same commands.

```bash
npm ci
npm run lint
npm run content:check
npm run docs:check
npm test
```

## Rules for changes

- Put a rule in `instructions/core.md` only when it applies in every session. Procedures and technology guidance belong in a skill.
- All skill descriptions together must stay under 12 KB. Check the count that `npm run content:check` prints, and leave headroom.
- When you change a skill's description, routing, authority, output contract, or workflow, update its `evals/evals.json` in the same change. Follow [the evaluation guide](docs/skill-evaluations.md).
- A skill must not link to files outside its own directory. Do not use absolute paths to this checkout.
- Do not edit the README platform table by hand. Run `npm run docs:generate`.
- Add a `CHANGELOG.md` entry under `Unreleased` for each user-visible change, with the pull-request link.
- Keep installer changes ownership-safe: never overwrite a file the installer cannot prove it owns, and keep the upgrade fixtures in `tests/` passing.
