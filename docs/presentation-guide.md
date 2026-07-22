# `ai-instructions`: Short Presentation Guide

**Suggested length:** 8-10 minutes, plus an optional 2-minute demo  
**Source snapshot:** final skill-first architecture, 2026-07-22  
**Core message:** treat AI behavior like code by making personal boundaries and reusable workflows explicit, versioned, reviewable, testable, and portable.

## 0:00 - Opening

> Generic AI coding tools do not know how I want work investigated, changed, verified, and delivered. This repository gives five product surfaces one shared, explicit operating model without turning every task into one enormous system prompt.

The one-line takeaway:

> **Keep durable boundaries always available, load detailed methods only for matching work, and test the distribution contract like any other toolchain.**

## 0:45 - The problem it solves

Without a shared instruction system:

- preferences and authority boundaries must be repeated in every conversation;
- different products handle the same task inconsistently;
- useful workflows remain personal habits instead of reviewable process;
- a correction improves one chat but is lost to the next one;
- adding more guidance can make unrelated tasks worse by consuming context.

The repository converts repeated interaction lessons into small, maintained contracts.

## 1:45 - The architecture

```text
Real interaction patterns and verified standards
                       |
          +------------+------------+
          |                         |
  Always-on boundaries       On-demand methods
 instructions/core.md       skills/*/SKILL.md
          +------------+------------+
                       |
          platforms/manifest.json
                       |
                Node installer
                       |
 Cursor | Claude Code | Codex | Copilot CLI | Gemini CLI
```

- **Universal instructions** hold product-neutral personal boundaries and defaults that should affect nearly every task. The generated core is currently 60 lines and 4,770 bytes.
- **Agent Skills** hold procedures, evidence rules, output contracts, and bundled references loaded only when their descriptions match the user's intent. The repository currently distributes 17 skills.
- **The platform manifest and installer** define product paths, formats, precedence, support tiers, and ownership-safe lifecycle behavior.
- **Project instructions** remain the right place for repository conventions and exceptions. Global guidance does not pretend every project uses the same stack.

The repository bundles no custom agents. A focused pilot found that direct accessibility, API-design, and performance skills produced the full capability while parallel agent prompts created evidence and output drift.

## 3:00 - What the content values

### Accessibility is correctness

Accessibility review begins with semantic HTML and verifies normative claims against WCAG, ARIA, APG, and HTML sources. Missing runtime evidence is recorded as a verification gap rather than promoted to a finding.

### Evidence beats confident memory

The workflows inspect installed code, types, consumers, the actual diff, and current primary documentation. A PR description or remembered API is input, not proof.

### Humans retain control

Review and diagnosis are read-only by default. Editing, committing, pushing, posting comments, and publishing are separate authority levels. A workflow stops instead of silently crossing those boundaries.

### Small outcomes are valid

A review may have no findings. A diagnosis may recommend no source change. Specialist skills reject speculative future-proofing and unmeasured optimization advice.

## 4:30 - A concrete workflow

Use “review this pull request” as the example:

1. `review-pr` resolves the real base, including stacked branches, and reads the complete diff, modified files, consumers, comments, reviews, thread state, and CI.
2. It always performs the complete core review.
3. It loads `review-accessibility`, `review-api-design`, or `review-performance` only when that domain is materially in scope.
4. It rechecks specialist findings against the change, normalizes severity, removes duplicates, and writes one portable Markdown review.
5. It does not post to GitHub unless the user separately asks for that remote write.

This shows progressive disclosure in practice: one coordinating workflow loads deeper methods without maintaining duplicate specialist prompts.

## 6:00 - Distribution and safety

`setup.sh` is a stable wrapper around a dependency-light Node installer. It can:

- target Cursor, Claude Code, Codex, GitHub Copilot CLI, and Gemini CLI;
- install, list, check, update, and remove instructions and skills;
- use repository-owned symlinks or managed copies;
- generate the product-specific instruction formats;
- preview changes with `--dry-run`;
- stage writes without clobbering an unexpected destination;
- remove stale managed artifacts while preserving user-maintained files;
- migrate pre-modernization default and copy-mode installations.

All product surfaces remain preview until current in-product discovery succeeds for every supported capability and named client. A correct file on disk is not treated as proof that a product loaded it.

## 7:15 - Verification

The repository checks:

- the 150-line and 8-KB universal-context budget;
- skill frontmatter, names, bundled links, and portable paths;
- manifest dates, paths, capabilities, and generated documentation;
- install, update, check, list, remove, copy, symlink, stale, conflict, and migration behavior;
- source preservation for user-owned files;
- Markdown and shell syntax across the full repository.

The final local content contract reports 17 skills, 0 agents, and the 60-line core. Product discovery evidence and blockers are recorded separately from installer tests.

## 8:15 - What it is not

- It is not universal best practice; it is a personal operating model with source-verified technical claims.
- It is not a replacement for project-level instructions.
- It is not a guarantee of perfect model behavior.
- It is not “more context is always better.”
- It is not an invitation to add another catalog, plugin, model grader, or lifecycle owner without measured need.

## 9:00 - Close

> The repository does not make agents autonomous for its own sake. It makes their work more predictable, inspectable, and aligned with human judgment.

Because the sources are Markdown in Git, a failure can lead to a reviewed contract change, a regression test, or a narrower workflow instead of another one-off prompt correction.

## Optional 2-minute demo

1. Show the two content layers:

   ```bash
   wc -l instructions/core.md
   find skills -name SKILL.md | sort
   ```

2. Open [`../skills/review-pr/SKILL.md`](../skills/review-pr/SKILL.md) and show its authority boundary and specialist routing.
3. Open [`../skills/review-accessibility/SKILL.md`](../skills/review-accessibility/SKILL.md) and show the evidence and no-findings contract.
4. Preview the lifecycle without changing user state:

   ```bash
   ./setup.sh update --agent codex --dry-run
   ```

5. End with [`discovery-evidence.md`](discovery-evidence.md) to show the distinction between filesystem correctness and live product verification.

## Likely questions

### Why no custom agents?

The pilot compared direct and delegated specialist execution on the same cases. The agents added no distinct tools, isolation benefit, or better result; they did introduce inconsistent severity and evidence behavior. [ADR 0004](decisions/0004-skill-first-specialists.md) records the reversible decision.

### How do you add a workflow?

Create `skills/<name>/SKILL.md` with one user intent, clear trigger and exclusions, authority and output contracts, evidence requirements, and completion criteria. Bundle detailed references inside that skill and run the repository checks.

### How does the installer avoid overwriting personal files?

It recognizes only repository-owned symlinks, managed markers, and complete managed skill directories. Unknown destinations are conflicts, not overwrite targets.

### Why are all products still preview?

The shared lifecycle tests pass, but current credentials or client coverage block complete instruction and skill discovery on at least one named surface. The support policy requires live evidence, not an inferred pass.

### What comes next?

Complete the remaining in-product discovery matrix and periodically refresh standards and adapter evidence. Optional distribution or evaluation infrastructure stays gated until a measured failure justifies it.
