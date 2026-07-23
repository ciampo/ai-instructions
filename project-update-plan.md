# Post-modernization implementation assessment

- **Status:** Architecture implementation complete; product acceptance and maintenance remain open
- **Assessed baseline:** `origin/main` at `34007084d2070f5abb6ddbc11269e6568139d5ab`
- **Assessment date:** 2026-07-22
- **Purpose:** Record the delivered architecture and the remaining evidence-based work

## Executive conclusion

The modernization plan has been implemented. The repository now has a small universal instruction core, 17 standard Agent Skills with bundled references, direct accessibility/API-design/performance specialists, one opt-in review coordinator, and a manifest-driven installer for five product surfaces.

The remaining work is product acceptance and routine maintenance, not another architecture migration. All five manifest surfaces remain preview until the current direct-skill architecture passes its acceptance matrix on every named client.

> Skills define and execute reusable capability. Add a custom agent only when measured execution value justifies one.

The specialist pilot found no such value from parallel custom-agent prompts; it did find output and evidence drift. The three specialist agents were therefore retired.

## Current architecture

```text
instructions/
  core.md                         Always-on personal boundaries

skills/
  */SKILL.md                      17 on-demand workflows and specialists
  */references/                   Detailed standards loaded only when needed

agents/
  review-coordinator.md           Opt-in orchestration over canonical review skills

platforms/
  manifest.json                   Paths, formats, capabilities, and support tiers

scripts/
  setup.mjs                       Cross-platform lifecycle entrypoint
  lib/                            Manifest, format, filesystem, and installer modules

docs/
  decisions/                      Accepted architecture decisions
  accessibility-review-pilot.md   Specialist comparison evidence
  discovery-evidence.md           Versioned live product results
  platform-support.md             Acceptance procedures and support policy
```

The canonical `agents/` directory contains only the opt-in coordinator. Installer support for old specialist-agent paths also validates fixtures and removes repository-owned retired artifacts without touching user-authored agents.

## Plan completion matrix

| Planned phase | Status | Evidence | Remaining work |
| --- | --- | --- | --- |
| Activate and measure | Complete | 90 configured artifacts pass across five adapters | Keep the long-lived checkout as lifecycle owner |
| Correct content and authority | Complete | Narrow technical guidance and explicit workflow authority landed | Maintain the contracts as skills evolve |
| Gather product evidence | Complete as an evidence phase | Versioned pass, fail, and blocked results are recorded | Complete the direct-skill acceptance matrix before promotion |
| Pilot accessibility review | Complete | The direct skill passed focused behavior and authority cases | Re-run routing checks after client changes |
| Decide specialist execution | Complete | Direct skills replaced three custom agents | Add an agent only after a measured need |
| Publish final architecture | Complete | ADR, README, migration, compatibility, and support records landed | Keep derived presentation material current |

## What changed from the original plan

### Installation ownership and activation

The earlier disposable-worktree ownership issue is resolved. Current Cursor, Claude Code, Codex, GitHub Copilot CLI, and Gemini CLI installations resolve from the long-lived checkout and pass the installer contract: one instruction artifact and 17 skills per configured surface, 90 artifacts total, and no distributed custom agents.

### Content correctness and workflow authority

The implementation narrowed accessibility, security, CSS, review, and repository claims to their actual evidence. It also made authority boundaries explicit: diagnosis and audits are read-only by default; local edits do not imply commits, pushes, posting, or publication; and preparation remains separate from release publication.

### Product discovery evidence

Filesystem checks prove safe installation, not product discovery. `docs/discovery-evidence.md` records named versions, source introspection, canaries, and remaining gaps. Historical agent checks remain decision input only; current acceptance must exercise the three direct specialist skills.

### Specialist model

`review-pr` performs a complete core review and invokes a direct specialist only when the domain is material. It rechecks the handoff against the diff and consumers, normalizes severity, removes duplicates, and owns the single final artifact. This keeps the capability portable without making custom-agent support a prerequisite.

## Correctly deferred work

- A skills-only external CLI remains optional; it cannot replace the installer without covering instructions, native formats, migration, conflicts, and stale cleanup.
- Native plugins, extensions, a catalog, or a generalized evaluation harness need their documented evidence gates before introduction.
- A custom agent remains an option only for demonstrated isolation, parallelism, tools, permissions, model configuration, or independently inspectable-output value.

## Remaining work

1. Complete the direct-skill acceptance matrix for each named client before promoting a support tier.
2. Refresh primary standards, platform documentation, product versions, and discovery results as clients change.
3. Retain compatibility and cleanup paths until their documented migration gates expire.

Priorities are to verify all three specialists across the Codex app, CLI, and IDE; recheck Cursor and Claude boundaries; complete the GitHub Copilot CLI release matrix; test Gemini only with a supported authentication context; and resolve the separate Google Antigravity CLI support decision before advertising it.

## Canonical records

- [docs/discovery-evidence.md](docs/discovery-evidence.md) records product acceptance.
- [docs/platform-support.md](docs/platform-support.md) defines support procedures and tiers.
- [docs/compatibility-policy.md](docs/compatibility-policy.md) defines removal gates.
- [docs/decisions/0004-skill-first-specialists.md](docs/decisions/0004-skill-first-specialists.md) records the specialist-execution decision.

Do not start another broad modernization phase unless current evidence identifies a new architectural problem.
