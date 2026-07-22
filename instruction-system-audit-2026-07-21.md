# AI instruction system audit

> **Superseded historical assessment (2026-07-21).** This document described the pre-modernization layout, including a 940-line always-on core, missing installed skills, distributed custom agents, and unresolved mutation boundaries. Those observations are not current. For the implemented architecture and remaining evidence-based work, use [project-update-plan.md](project-update-plan.md). [presentation-guide.md](presentation-guide.md) is a derived talk track, not an architecture source of truth.

## Historical context

The July 21 audit identified competing globally loaded guidance, overly universal technical advice, unclear authorization boundaries, and an installation that had not yet caught up with the repository's intended architecture. Its recommended sequence was to activate the latest source, narrow technical claims, move specialist procedure into skills, and validate the resulting architecture in real products.

That work has since landed. The current source has a small universal core, 17 on-demand skills, no distributed custom agents, a manifest-driven installer for five product surfaces, and explicit authority and discovery-evidence contracts.

## Current replacement assessment

The architecture migration is complete. Remaining work is limited to product acceptance and routine maintenance:

1. Run the direct-skill acceptance matrix on each named client before promoting a platform tier.
2. Keep standards, product versions, and discovery evidence current.
3. Retain compatibility and cleanup code until the documented migration gates expire.
4. Add new infrastructure, such as a custom agent or external skills CLI, only when measured need justifies it.

The current authoritative records are:

- [project-update-plan.md](project-update-plan.md) for the implementation assessment and remaining work;
- [docs/discovery-evidence.md](docs/discovery-evidence.md) for product-level results and blockers;
- [docs/platform-support.md](docs/platform-support.md) for support-tier procedures;
- [docs/decisions/0004-skill-first-specialists.md](docs/decisions/0004-skill-first-specialists.md) for the specialist-execution decision.
