# Presenter guide: AI instructions as versioned engineering knowledge

- **Length:** 10 minutes, plus an optional two-minute demo
- **Audience:** Engineers who use one or more AI coding tools
- **Baseline:** `main` at `34007084d2070f5abb6ddbc11269e6568139d5ab`
- **Goal:** Explain the architecture, evidence, and remaining work without walking through every file

## Central takeaway

> This repository treats AI behavior like engineering configuration: small persistent boundaries, task-specific skills loaded on demand, safe cross-platform distribution, and evidence instead of assumed support.

## Before presenting

Open [`README.md`](README.md), [`instructions/core.md`](instructions/core.md), [`skills/review-pr/SKILL.md`](skills/review-pr/SKILL.md), [`platforms/manifest.json`](platforms/manifest.json), [`docs/accessibility-review-pilot.md`](docs/accessibility-review-pilot.md), and [`docs/discovery-evidence.md`](docs/discovery-evidence.md).

## 0:00 — Opening

Say:

> AI coding tools begin generic. They do not automatically know our authority boundaries, verification standards, or delivery preferences. This repository makes those judgments versioned, reviewable, and portable.

Set the expectation that the talk covers how guidance is structured, how it is distributed safely, and what product testing taught us.

## 0:45 — The problem

Without a system, useful instructions are repeated manually, copied differently between tools, mixed with repository facts, loaded when irrelevant, and assumed to work because a file exists.

Say:

> The goal is not the biggest possible prompt. It is the smallest relevant guidance at the right time.

## 1:40 — The architecture

The repository provides four layers:

1. Persistent personal boundaries for communication, verification, authority, safety, implementation, and delivery.
2. On-demand skills for workflows such as review, debugging, dependency audits, releases, and specialist analysis.
3. A manifest-driven installer for Cursor, Claude Code, Codex, GitHub Copilot CLI, and Gemini CLI.
4. Evidence and maintenance records for content accuracy, installation safety, migration, and product discovery.

```text
instructions/core.md       Always-on personal boundaries
skills/*/SKILL.md           Task-specific workflows and specialists
skills/*/references/        Detailed standards loaded only when needed
platforms/manifest.json     Product paths, formats, and support tiers
scripts/setup.mjs           Safe lifecycle and format adaptation
docs/                       Decisions, evidence, migration, and support policy
```

The current scale is intentionally modest: a 60-line generated universal core, 17 standard skills, zero distributed custom agents, and five configured product adapters.

## 3:00 — Progressive disclosure

Open [`instructions/core.md`](instructions/core.md). It contains only durable cross-task boundaries: concise communication, honest verification, explicit authority, preservation of user-owned work, and basic delivery constraints.

Say:

> React patterns, accessibility checklists, GitHub procedure, and release instructions do not belong in every conversation. They load only when their skill is relevant.

Skills use standard frontmatter as a routing contract. Their bodies define intent, authority, method, evidence requirements, output, and completion criteria. Repository and nested `AGENTS.md` files remain responsible for local facts and exceptions.

## 4:15 — Why direct skills replaced specialist personas

The project compared direct accessibility, API-design, and performance skills with parallel custom-agent prompts. The agents added no distinct tools, permissions, model configuration, isolation benefit, or result-quality improvement. They did introduce duplicated prompts and evidence/output drift.

The resulting decision is simple:

- `review-accessibility`, `review-api-design`, and `review-performance` are direct skills.
- The repository distributes no custom agents.
- A custom agent is justified only by measured execution value, such as isolation, parallelism, different tools or permissions, model configuration, or independently inspectable output.

`review-pr` still owns the complete review. It loads a specialist only when material, rechecks the handoff against the actual diff and consumers, normalizes severity, and produces one final artifact.

## 5:30 — Why the installer remains

Each product has distinct paths and native instruction formats. The installer owns install, update, check, list, removal, format adaptation, no-clobber writes, ownership markers, stale cleanup, conflict preservation, and migration from older layouts.

Say:

> A standard skills CLI may be useful for a skills-only audience. It does not replace the lifecycle owner for universal instructions, native formats, five destinations, migration, and conflict safety.

## 6:45 — Values

1. **Human authority:** review and diagnosis do not silently authorize edits; edits do not silently authorize commits, pushes, posts, or releases.
2. **Evidence over confident prose:** technical claims and review findings need source or observable support.
3. **Progressive disclosure:** detailed workflow guidance appears only when selected.
4. **Accessibility as engineering quality:** requirements, patterns, and reliability techniques remain distinct.
5. **Preserve user-owned state:** ambiguous installed artifacts fail closed.
6. **Simplicity earned through evidence:** defer new layers until observed behavior justifies them.

## 7:45 — Verification and support claims

The repository checks skill resources, core size, manifests, generated formats, copy/symlink lifecycles, conflict preservation, stale cleanup, legacy upgrades, and generated support documentation. The active installer reports 90 healthy artifacts across five adapters.

Say:

> Filesystem verification proves that the correct artifact was installed safely. It does not prove the product discovered or followed it. That requires live client checks.

All five advertised surfaces remain preview. `docs/discovery-evidence.md` records exact versions, canary outcomes, and blockers. Support is a measured product contract, not a list of folders that copied successfully.

## 9:20 — Next work and close

The architecture migration is complete. Next work is to complete direct-skill acceptance for named clients, resolve the Google CLI split, maintain source and product freshness, retire compatibility only through its gates, and add infrastructure only when evidence justifies it.

Close with:

> The repository's value is not more autonomy. It is more predictable collaboration: guidance reviewed in Git, loaded only when relevant, distributed safely, and tested against both filesystem contracts and real product behavior.

## Optional two-minute demo

1. Show the compact core with `wc -l -c instructions/core.md` and `sed -n '1,100p' instructions/core.md`.
2. Show discoverable skills with `find skills -type f -name SKILL.md -print | sort`.
3. Show installer health with `./setup.sh check --agent codex`.
4. Open the pilot and discovery-evidence records.

End before exploring every installer option.

## Presenter checklist

- Say 17 skills and zero custom agents.
- Say five preview product surfaces, not five verified products.
- Distinguish installer verification from in-product discovery.
- Describe the installer as the lifecycle owner, not a skills-only tool.
- Present the skill-versus-agent decision as evidence-based.
