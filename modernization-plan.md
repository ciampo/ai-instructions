# AI instructions modernization plan

Status: core implementation complete; product discovery acceptance remains open. The original audit baseline remains below for historical context.

Audit date: 2026-07-20

Core implementation completed: 2026-07-21

Discovery update: 2026-07-22. Gemini CLI no longer accepts individual Google AI Pro, Ultra, or free-tier OAuth. The existing Gemini adapter remains preview for its still-supported enterprise, Google Cloud, and paid API contexts; Google Antigravity CLI is a separate surface tracked in [issue #40](https://github.com/ciampo/ai-instructions/issues/40).

The delivered architecture has a budget-constrained universal core, standard Agent Skills with bundled references, native custom-agent adapters, a validated platform manifest, a modular Node installer, generated support documentation, atomic ownership-safe lifecycle operations, content budgets, and Linux/macOS/Windows CI coverage. Product discovery checks that cannot be automated are documented in [`docs/platform-support.md`](docs/platform-support.md), with current results in [`docs/discovery-evidence.md`](docs/discovery-evidence.md). All product tiers remain preview until that acceptance matrix passes.

## Executive assessment

The repository has a sound core idea: keep personal preferences, reusable
workflows, and specialist review prompts in one versioned source. The content is
thoughtful, the installer is cautious about user-owned files, and the existing
Cursor and Codex regression tests pass.

The main problem is that the implementation still models the ecosystem from a
few months ago. All five supported products now distinguish persistent
instructions, on-demand Agent Skills, and custom agents. This repository instead
loads almost all guidance eagerly, stores skills and personas in non-standard
source formats, and handles platform capabilities through hard-coded exceptions.
Some resulting artifacts are not discoverable by the target product.

The recommended direction is:

1. Keep a small, universal core of personal instructions.
2. Move task procedures into standards-compliant Agent Skills.
3. Move specialist personas into explicit custom-agent packages.
4. Generate product-specific adapters from declarative metadata.
5. Test every claimed platform and output format in CI.

Do not add more platforms until the five already advertised are correctly and
consistently supported.

## Scope and method

This review covered:

- every instruction, skill, persona, test, workflow, and installer path;
- installer behavior for install, update, check, list, remove, copy, and
  conflict handling;
- current official documentation for Cursor, Claude Code, Codex, GitHub
  Copilot CLI, Gemini CLI, the Agent Skills specification, WCAG, and APG;
- the current lint, shell syntax, installer test, and dependency-audit baseline.

This is a repository architecture and content audit. It does not attempt to
judge whether every personal preference should remain a personal preference.
It does identify preferences that are presented as universal technical facts or
that are too broad to apply safely across repositories.

## Audit baseline

This snapshot records the repository state on 2026-07-20, before the Phase 0
changes included in this pull request.

| Area | Current state |
| --- | --- |
| Persistent instructions | 14 files, 856 lines, 7,404 words |
| Generated Codex instructions | 940 lines, 7,612 words, 54,247 bytes |
| Skills | 10 flat Markdown files without YAML frontmatter |
| Personas | 3 flat Markdown files without YAML frontmatter |
| Installer | One 1,818-line Bash script with embedded platform registry and generators |
| Tests | Cursor and Codex installer integration tests only |
| CI | Markdown lint only; installer tests are not run |
| Dependency state | `markdownlint-cli2` 0.22.0 installed; 0.23.1 current |
| Dependency audit | 1 high and 4 moderate transitive vulnerabilities |

Baseline checks:

- `bash -n setup.sh tests/*.sh`: passes.
- `npm run lint`: passes.
- `npm run test:installer`: passes.
- `npm audit --audit-level=high`: fails because of transitive vulnerabilities
  in `linkify-it`, `js-yaml`, `markdown-it`, and `smol-toml`.

Passing tests currently demonstrate that the installer reproduces its intended
Cursor and Codex layouts. They do not demonstrate that current product versions
discover or apply those artifacts.

## Target architecture

```text
core/                         Small, product-neutral personal defaults
rules/                        Optional domain or path-scoped guidance
skills/
  review-pr/
    SKILL.md                  Agent Skills standard entrypoint
    references/               Supporting checklists loaded on demand
agents/
  a11y-reviewer/
    agent.json                Product-neutral metadata
    prompt.md                 Product-neutral agent instructions
platforms/
  manifest.json               Paths, capabilities, formats, support tier
scripts/
  setup.mjs                   Deterministic installer and generators
setup.sh                      Backward-compatible wrapper
tests/
  fixtures/                   Isolated homes and conflict cases
  snapshots/                  Exact generated artifacts per product
docs/
  platform-support.md         Verified paths, versions, and source links
  migration.md                Cleanup and upgrade instructions
```

The exact names can change during implementation. The important boundaries are:

- **Core** is short and always loaded.
- **Rules** are declarative guidance, scoped where the product supports it.
- **Skills** are procedural and loaded only for matching work.
- **Agents** represent delegated identities and product-specific capabilities.
- **Adapters** translate canonical content into native product formats.

## Platform support assessment

### Support matrix

| Platform | Current repository behavior | Current platform capability | Assessment | Target |
| --- | --- | --- | --- | --- |
| Cursor | Generates always-on `~/.cursor/rules/*.mdc`; installs skills under `~/.cursor/skills-cursor`; copies raw personas to `~/.cursor/agents` | Rules, Agent Skills, and custom subagents are supported | Skill path is outdated; skill metadata is missing; persona format is incomplete; file-backed global rules need verification against the installed product | Small documented user rule, standard skills in a supported user directory, valid custom agents |
| Claude Code | Installs `~/.claude/rules/*.md` and generated skill copies; no personas | User rules, Agent Skills, and user custom agents are supported | Rules are broadly correct; the reminder to reference them from `CLAUDE.md` is stale; skills are non-portable; agents are omitted | Small user rules, standard skills, valid agents, no redundant reminder |
| Codex | Concatenates everything into `~/.codex/AGENTS.md`; marks skills and personas unsupported | Global `AGENTS.md`, standard skills, and user custom agents are supported | The matrix is outdated; the 54 KB eager prompt defeats progressive disclosure; routing points to source-repo files; override precedence is not checked | Minimal `AGENTS.md`, skills under `~/.agents/skills`, generated TOML agents under `~/.codex/agents` |
| GitHub Copilot CLI | Installs generated skill copies; optionally writes a repository-wide concatenated instruction file; no personas | Personal and modular instructions, Agent Skills, and user custom agents are supported | Personal instructions and agents are omitted; skills lack required metadata; concatenated routing can reference files absent from the target repository | Personal CLI instructions, standard skills, valid agents; repository export remains explicit |
| Gemini CLI | Installs generated skill copies only | `GEMINI.md` context, Agent Skills, and user custom agents are supported | Instructions and agents are omitted; skills without frontmatter may be silently skipped | Small user context, standard skills, and valid agents for the explicitly named Gemini CLI surface |

### Source-of-truth notes

- The [Agent Skills specification](https://agentskills.io/specification)
  requires a skill directory containing `SKILL.md` with `name` and
  `description` frontmatter. It also defines progressive disclosure and
  relative bundled resources. The current flat source files do not meet that
  contract.
- [Codex customization](https://developers.openai.com/codex/concepts/customization),
  [AGENTS.md discovery](https://developers.openai.com/codex/guides/agents-md),
  [Agent Skills](https://developers.openai.com/codex/skills), and
  [custom agents](https://developers.openai.com/codex/subagents) now cover all
  three repository concepts.
- Claude Code documents [persistent instructions and rules](https://code.claude.com/docs/en/memory),
  [Agent Skills](https://code.claude.com/docs/en/skills), and
  [custom subagents](https://code.claude.com/docs/en/sub-agents). Its guidance
  also recommends keeping persistent instruction files concise and moving
  workflows into skills.
- Cursor distinguishes [rules](https://cursor.com/docs/rules) from dynamically
  loaded [skills](https://cursor.com/docs/skills). Its current product also
  supports user and workspace subagents. The undocumented
  `~/.cursor/skills-cursor` target should not be treated as a public install
  surface.
- GitHub documents [personal and repository instruction support](https://docs.github.com/en/copilot/reference/custom-instructions-support),
  [Agent Skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills),
  and [user custom agents](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/invoke-custom-agents)
  for Copilot CLI.
- Gemini CLI documents [persistent context](https://geminicli.com/docs/cli/gemini-md/),
  [user and workspace skills](https://geminicli.com/docs/cli/using-agent-skills/),
  [custom subagents](https://geminicli.com/docs/core/subagents/), and
  [authentication options](https://geminicli.com/docs/get-started/authentication/)
  for individual, organization, API-key, and Vertex AI users. This repository
  targets Gemini CLI explicitly; other Google agent products are separate
  surfaces.

### Recommended support policy

Define support by product surface, not brand name. For example, target
"GitHub Copilot CLI" explicitly rather than implying identical behavior across
GitHub.com, VS Code, JetBrains, and the CLI.

Use three support tiers:

- **Supported**: official path and format verified, full lifecycle integration
  test present, and discovery smoke-tested in the product where automation is
  possible.
- **Preview**: adapter and tests exist, but product discovery still requires a
  documented manual verification.
- **Unsupported**: no generated output and no implied compatibility.

The README support table should be generated from the same manifest as the
installer so documentation and behavior cannot drift independently.

## Findings and recommendations

### P0: Fix correctness and security issues first

1. **Skills are not standards-compliant.** Convert each flat
   `skills/<name>.md` file to `skills/<name>/SKILL.md` with valid `name` and
   `description` frontmatter. Make each installed skill self-contained; use
   `references/`, `scripts/`, or `assets/` for content loaded on demand.

2. **The Cursor skill destination is not a public user-skill path.** Migrate
   managed entries away from `~/.cursor/skills-cursor`. Prefer the documented
   user skill location or the shared `~/.agents/skills` alias after verifying
   the installed Cursor version. Preserve user-owned files and remove only
   artifacts bearing this repository's managed marker.

3. **Personas are not valid custom-agent definitions.** Rename the concept to
   `agents` and generate native definitions. Claude, Cursor, Gemini, and
   Copilot use Markdown with YAML-based metadata, but their optional fields
   differ. Codex uses TOML. Keep the prompt canonical and make formats explicit
   adapters instead of pretending they are interchangeable.

4. **The accessibility standard contains a conformance error.** It describes
   44 by 44 CSS pixels as WCAG AA. In WCAG 2.2,
   [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
   is Level AA at 24 by 24 CSS pixels with exceptions, while
   [2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced)
   is Level AAA at 44 by 44 CSS pixels. Preserve 44 by 44 as a strong design
   preference if desired, but label the normative requirement accurately.

5. **The dependency audit is not clean.** Upgrade `markdownlint-cli2` only
   after following the repository's dependency-audit workflow and reading the
   0.22-to-0.23 release notes. Commit the lockfile, rerun lint and installer
   tests, and require no known high-severity vulnerabilities in CI.

6. **`check` can report stale content while exiting successfully.** A modified
   managed Codex file produces an "out of date" warning and exit code 0. This
   contradicts the README and prevents reliable CI use. Define exit codes for
   missing, stale, conflicting, and unsupported artifacts, then write failing
   regression tests before changing the implementation.

### P1: Reduce always-on context

The current taxonomy says every file in `instructions/` is always loaded.
That includes React, design-system, Storybook, i18n, security, performance,
error-handling, GitHub, and release guidance in unrelated sessions. Codex
receives a 940-line global file before project instructions are considered.

Reclassify content:

- Keep communication style, safety boundaries, scope discipline, source
  verification, and basic change verification in the universal core.
- Move framework and domain guidance into scoped rules or reference material:
  React, TypeScript, CSS, design systems, accessibility, i18n, security,
  performance, and error handling.
- Move procedures entirely into skills: PR review, dependency updates,
  debugging, releases, refactors, and session resumption.
- Remove `workflow-routing.md` once all supported products can discover skill
  descriptions natively. Retain a generated fallback only for a product that
  demonstrably lacks skills.
- Generate the `guardrails` subset from canonical rule identifiers or remove
  the duplication. Do not maintain the same hard rule manually in three files.

Initial budget: keep the generated universal instruction artifact below 150
lines and 8 KB. Treat that as a regression-tested budget, not a target to fill.

### P1: Make instructions contextual rather than accidentally universal

Separate three kinds of statement:

- **Personal boundary**: always applies, such as never posting a GitHub comment
  without authorization.
- **Repository convention**: applies only when the target repository follows
  it, such as a specific changelog or branch format.
- **Technical standard**: must cite and accurately represent an official
  source, such as WCAG, APG, or a product configuration contract.

Review every `[RULE]` using that classification. In particular:

- "Always include a changelog for user-facing changes" should defer to the
  target repository's release policy unless it is intentionally a personal
  override.
- React, Storybook, CSS Modules, package-manager, and GitHub CLI guidance
  should activate only when those technologies are present.
- Accessibility overlay rules should identify the actual APG pattern. The
  [APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
  requires contained tab behavior and Escape dismissal, but initial focus is
  contextual; it is not accurately reduced to one preferred element for every
  dialog.
- Claims about browser or library behavior should include a verification date
  and source. Personal preferences should not be disguised as standards.

Add a short standards index recording the official URL, affected rule, and
last-reviewed date. Review it periodically without embedding fast-changing
model names or product versions in the rules themselves.

### P1: Replace platform branching with declarative adapters

The setup script repeats product cases for detection, instruction directories,
extensions, skill directories, agent directories, and special generation.
Adding one capability requires coordinated edits across distant functions and
documentation.

Create one platform manifest with at least:

- product and surface identifier;
- detection strategy;
- supported capabilities;
- user and project destinations;
- native format or generator;
- symlink/copy policy;
- precedence and conflict rules;
- support tier and last verification date.

Generate installation behavior, support documentation, and test cases from
that manifest. Keep platform-specific logic in small adapters.

The recommended implementation is a Node-based CLI using built-in APIs, with
`setup.sh` retained as a compatibility wrapper. The repository already requires
Node for linting, and structured generation, staged writes, Windows paths, and
test fixtures are easier to maintain than in a single 1,818-line Bash file.
Before committing to the migration, write an architecture decision record that
compares this option with splitting the existing Bash implementation. Do not do
a big-bang rewrite without behavior-locking tests.

### P1: Make workflows capability-aware

Several skills assume a particular host rather than state their prerequisites:

- `review-pr` assumes `gh`, a git checkout, network access, and an editor.
- `draft-review-comment` requires opening a local file even when the host has no
  editor-control capability.
- `self-review-pr` requires subagent support without a fallback.
- `resume-session` assumes a compatible persistent-history mechanism.
- `release-publish` moves from preparation into remote publishing without a
  distinct authorization boundary.

Each skill description should say when it applies. The body should declare
required capabilities, safe fallbacks, mutation boundaries, expected outputs,
and completion criteria. Split "prepare release" from "publish release" so a
planning request cannot implicitly authorize a remote release.

### P1: Test product contracts, not only file creation

Expand tests into a matrix covering all five advertised platforms:

- install, update, check, list, and remove;
- symlink and copy modes;
- every category and partial-install combination;
- clean, current, stale, broken, conflicting, and user-owned destinations;
- exact instruction, skill, and agent output snapshots;
- standards validation for every `SKILL.md`;
- native schema validation for every generated custom agent;
- precedence cases such as Codex `AGENTS.override.md`;
- migration from every legacy managed destination;
- path handling on macOS, Linux, Windows, and WSL where supported.

Run shell syntax checks and all installer tests in CI immediately. If the
installer moves to Node, add a supported-OS matrix and keep the shell wrapper
smoke test. Add a manual release checklist for product discovery that cannot be
tested headlessly.

### P2: Improve documentation and maintenance

- Replace the hand-maintained platform table with generated documentation.
- State the exact product surface and support tier for every adapter.
- Document how to verify that each product discovered the installed skill or
  agent, not merely that a file exists.
- Add a migration guide for old Cursor, Codex, and generated Copilot layouts.
- Add contribution checks for frontmatter, names, descriptions, references,
  managed markers, and instruction-budget limits.
- Add Dependabot or an equivalent update mechanism after the current audit is
  clean.
- Consider native distribution packages only after the core formats stabilize:
  Codex plugins, Claude plugins, Copilot plugins, and Gemini extensions can
  package skills and agents more cleanly than a personal installer in some
  environments.

## Phased implementation plan

### Phase 0: Lock behavior and repair urgent issues

Status: CI coverage, `check` exit behavior, the target-size correction, and the
dependency audit are complete in [#19](https://github.com/ciampo/ai-instructions/pull/19).
The scoped standards review is complete in [#22](https://github.com/ciampo/ai-instructions/pull/22), and the frozen historical migration fixture is added in [#24](https://github.com/ciampo/ai-instructions/pull/24).

1. Add the existing installer regression suite and `bash -n` to CI.
2. Add failing tests for stale/conflicting `check` exit codes.
3. Correct the WCAG target-size language and audit other normative a11y claims
   against WCAG, APG, and ARIA.
4. Audit and upgrade `markdownlint-cli2`; commit its lockfile changes.
5. Record the current generated outputs as migration fixtures, not desired
   golden snapshots.

Exit criteria:

- CI runs lint and installer tests.
- `check` is reliable for automation.
- no known high-severity dependency advisory remains.
- normative accessibility claims are source-linked and correctly leveled.

### Phase 1: Adopt canonical skill and agent formats

1. Convert one representative workflow, `review-pr`, to a standard skill with
   bundled references.
2. Validate discovery on all five products before converting the remaining
   skills.
3. Convert the remaining workflows and remove generated dependency-path
   rewriting.
4. Define canonical agent metadata and prompts.
5. Generate and validate native agents for each supported product.

Exit criteria:

- every skill passes structural validation and can be listed by each supported
  product;
- every specialist can be invoked as a native custom agent where supported;
- installed artifacts do not reference the source checkout by absolute path.

### Phase 2: Introduce the platform manifest and adapters

1. Add behavior-locking fixtures for the existing safe installer semantics.
2. Create the declarative platform manifest.
3. Implement adapters one product at a time, including legacy cleanup.
4. Generate the README support matrix from the manifest.
5. Keep `setup.sh` as a compatibility entrypoint through at least one migration
   cycle.

Exit criteria:

- all five adapters pass the same lifecycle contract;
- user-owned files are never overwritten or removed;
- install and update are staged, no-clobber, and idempotent;
- unsupported capabilities are reported explicitly.

### Phase 3: Reclassify and trim instructions

1. Inventory every instruction as core, scoped rule, skill reference, agent
   prompt, repository convention, or obsolete duplication.
2. Reduce the universal core to the agreed budget.
3. Add product-native scoping where supported.
4. Remove `workflow-routing` after native skill discovery is proven.
5. Test representative prompts to confirm that boundaries remain effective and
   domain guidance activates only when relevant.

Exit criteria:

- universal output is below 150 lines and 8 KB;
- no framework-specific guidance is injected into unrelated work;
- hard personal boundaries remain present on every supported platform.

### Phase 4: Complete quality, documentation, and migration support

1. Add full platform and operating-system CI matrices.
2. Publish the support policy, verified paths, discovery checks, and migration
   guide.
3. Add dependency and standards-refresh automation.
4. Remove legacy adapters only after the documented migration window.
5. Evaluate native plugin/extension distribution as a separate follow-up.

## Recommended first implementation slice

Keep the first pull request narrow and independently valuable:

1. Make CI run `bash -n` and `npm run test:installer`.
2. Add a regression test and fix for non-zero stale `check` results.
3. Correct the WCAG target-size statement.
4. Upgrade `markdownlint-cli2` through the dependency-audit workflow.
5. Add this document to the README as the active roadmap.

Then use a second pull request for the Agent Skills migration. Combining the
installer rewrite, content taxonomy, and every platform adapter in one change
would make regressions and user-config cleanup unnecessarily difficult to
review.

## Decisions to confirm before implementation

Recommended defaults are shown first.

1. **Primary scope:** user-level personal configuration, with repository export
   as an explicit secondary command. Do not silently write project files.
2. **Copilot target:** Copilot CLI first. Treat IDE and GitHub.com behavior as
   separate surfaces if added later.
3. **Cursor user rules:** use only a documented public install mechanism. Keep
   the current file-backed global rule adapter in preview until verified in the
   installed Cursor version.
4. **Installer language:** move to a dependency-light Node CLI behind the
   existing shell entrypoint after behavior tests exist.
5. **Windows:** continue promising WSL only until a Windows CI job proves native
   path, symlink, and copy behavior.
6. **Instruction strictness:** preserve genuine personal boundaries globally;
   scope technology and repository conventions based on detected context.
7. **Google surfaces:** retain Gemini CLI in preview only for its supported
   enterprise, Google Cloud, and paid API authentication contexts. Individual
   users are directed to Google Antigravity CLI; model it as a separate adapter and
   do not inherit the Gemini support claim or paths.

## Definition of done

The modernization is complete when:

- every advertised capability maps to a current official product contract;
- every skill and agent is discoverable, not merely copied;
- the universal instruction payload is small and measured;
- all five platform adapters pass a shared lifecycle test suite;
- CI exercises the installer and validates generated formats;
- `check` returns meaningful automation-safe exit codes;
- migrations preserve user-owned content and clean only managed legacy files;
- no high-severity dependency advisories remain;
- normative standards claims include current primary sources and review dates;
- README support claims are generated from tested configuration.

Current status: the architecture, lifecycle matrix, migration coverage, content budget, generated documentation, standards index, and dependency gates are implemented. The remaining definition-of-done work is successful instruction, skill, and agent discovery on current releases of every client named by the five currently manifested product surfaces, plus resolution of the Gemini support policy and a separate Google Antigravity CLI adapter in [issue #40](https://github.com/ciampo/ai-instructions/issues/40). Native distribution is intentionally deferred by [ADR 0003](docs/decisions/0003-native-distribution.md), and legacy removal is governed by the [compatibility policy](docs/compatibility-policy.md).
