# ADR 0005: Make `AGENTS.md` the Canonical Shared Instruction Artifact

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

The previous source of the always-on core was `instructions/core.md`. The installer adapted it into five product-specific user-level instruction locations. That preserved a safe lifecycle owner, but left a repository that supports more than one coding agent without a shared, discoverable instruction file.

Current vendor guidance has converged substantially around repository-root `AGENTS.md`:

| Product surface | Current documented behavior | Consequence |
| --- | --- | --- |
| Codex | Reads global and hierarchical `AGENTS.md` files, with nearer project files taking precedence. | Use `AGENTS.md` directly. |
| Claude Code | Reads `CLAUDE.md`; its documentation explicitly recommends a `CLAUDE.md` containing `@AGENTS.md` when a project already has shared instructions. | Keep only Claude-specific additions in the wrapper. |
| GitHub Copilot CLI | Discovers `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` in standard repository locations; its instruction files support `@` references. | A shared root file avoids a second full instruction body. |
| Gemini CLI | Supports `@` imports and can be configured to recognize `AGENTS.md` as a context filename. | Prefer the shared file; use `GEMINI.md` only for Gemini-specific behavior. |
| Cursor | Supports root `AGENTS.md` as a simple alternative to project rules; rules remain appropriate for metadata or path scoping. | Use the shared file for the common core and rules only when their extra capability is needed. |

This is convergence, not a uniform standard. In particular, global discovery, nesting, override precedence, settings, and import trust boundaries still vary by product. The installer must not treat a generated file in one product's home directory as another product's canonical input.

The content decision remains separate from the filename decision. The current core is deliberately small, while task procedures and technology guidance live in Agent Skills. That boundary should be retained: recent empirical research associates large or redundant context files with higher cost and no reliable task-success improvement, and a contemporaneous configuration-smell study identifies context bloat, lint leakage, and conflicting guidance as recurring risks.

## Decision

Adopt `AGENTS.md` as the single canonical **repository-level shared instruction artifact**.

The implemented model is:

```text
AGENTS.md                         shared, concise repository guidance
CLAUDE.md                         @AGENTS.md, then Claude-only guidance if needed
GEMINI.md                         @AGENTS.md, then Gemini-only guidance if needed
.cursor/rules/*.mdc              only metadata- or path-scoped Cursor guidance
.github/copilot-instructions.md  only Copilot-specific guidance where required
skills/*/SKILL.md                 reusable procedures and detailed references
```

`AGENTS.md` will contain only guidance that is genuinely shared and always relevant: repository setup, verification, boundaries, and durable conventions. It will not become a second home for procedures already represented by skills or for product-specific settings.

The global installer remains an adapter, not an implicit project exporter:

1. A user-level install must continue to work when only one supported product is installed.
2. It must never make `~/.codex/AGENTS.md` the source imported by Claude, Copilot, Gemini, or Cursor. That creates a hidden dependency on a separate product's installation, override state, and removal lifecycle.
3. Where a product needs a native user-level file, the adapter will derive it from the canonical source and own every generated sidecar or wrapper using the existing no-clobber and managed-marker rules.
4. A project export remains explicit. It should write the shared root `AGENTS.md` first, then generate only the thin product wrappers that the selected project tools actually need.
5. A wrapper must use a relative import of the co-located or project-root canonical file. Do not generate absolute imports into a local checkout or another product's home directory.

## Why This Direction

- It gives supported coding agents one human-maintained repository contract instead of five full copies.
- It follows the interoperable path already documented by Codex, Claude Code, Copilot CLI, Gemini CLI, and Cursor.
- It preserves native features rather than flattening them: Claude, Gemini, Cursor, and Copilot retain their own scoped or product-specific mechanisms.
- It keeps current safety properties. The manifest-driven installer remains responsible for copy versus symlink mode, conflicts, stale cleanup, update, check, and remove.
- It avoids confusing personal global preferences with project-owned conventions. A repository can adopt the shared artifact without also adopting this repository's global installer.

## Alternatives Considered

### Keep `instructions/core.md` as the only canonical artifact

This keeps the current installer simple, but every repository that wants cross-agent guidance still has to choose and maintain a separate entrypoint. It misses the documented shared-file path and makes per-product duplication the default.

### Make `~/.codex/AGENTS.md` the canonical global file and import it elsewhere

Rejected. It works only when Codex is installed and configured, makes other products depend on Codex's override precedence, and breaks the independent install/update/remove contract that the manifest currently provides.

### Replace every native file with `AGENTS.md`

Rejected. Product-native configuration remains useful for user-level scope, path-scoped guidance, metadata, permissions, and product-only behavior. The common file should carry common content; it must not erase supported native capabilities.

### Maintain independent full instruction files

Rejected. It invites drift, conflicting instructions, and unnecessary always-on context. Thin wrappers are easier to inspect and test.

## Implementation

1. Root `AGENTS.md` now contains the previous universal core without changing its scope or budget.
2. The manifest has explicit `direct` and `wrapper` strategies. The wrapper strategy writes a managed adjacent `AGENTS.md` and a native file that imports it relatively.
3. The artifact builder and lifecycle code install, check, update, and remove both files in the wrapper adapter. It preflights the pair for user-owned conflicts before mutating either file.
4. Codex receives the canonical content directly. Claude, Copilot, and Gemini receive thin native wrappers; Cursor keeps its native rule adapter for user scope.
5. The compatibility `--copilot-concat` option explicitly exports only project-root `AGENTS.md`, which Copilot discovers directly. It removes a repository-owned wrapper from an earlier export and preserves user-owned `.github/copilot-instructions.md` files for genuinely Copilot-specific guidance.
6. Legacy cleanup and user-owned conflict protection remain under the compatibility policy. The frozen pre-modernization upgrade fixtures continue to pass.
7. The README, migration guide, support policy, and source index describe the current implementation. Product support remains preview until fresh discovery proves the new wrappers load on current client releases.

## Ongoing Acceptance Criteria

Before promoting a support claim:

1. Verify the documented project-level behavior on current releases of Codex, Claude Code, Copilot CLI, Gemini CLI, and Cursor. Record exact versions and results in discovery evidence.
2. In disposable homes, cover install, idempotent reinstall, list, check, update, remove, copy mode, user-owned conflicts, managed stale sidecars, and interrupted replacement for every changed adapter.
3. In a disposable repository, verify that a project containing only `AGENTS.md` supplies the common rule to every claimed product surface.
4. For every generated wrapper, verify that it resolves the intended relative import once, does not duplicate the shared content, and leaves product-specific additions ordered after the shared content.
5. Verify that an absolute import, an import outside the project, a missing sidecar, and a user-owned wrapper fail safely and produce actionable `check` output.
6. Keep the universal artifact within the existing 150-line and 8-KB budget, and confirm that workflows and technical standards remain discoverable only through skills.
7. Do not promote a platform tier based only on filesystem tests. Complete the existing release verification checklist and product discovery checks.

## Non-Goals

- Declaring `AGENTS.md` a formal universal standard or claiming behavior beyond the documented product surfaces.
- Replacing Agent Skills, custom product settings, hooks, permissions, or path-scoped rules.
- Automatically editing third-party repositories during a user-level install.
- Coupling a product's global configuration to another product's installation.
- Promoting any support tier without fresh product discovery evidence.

## Sources Reviewed on 2026-07-22

- [Codex `AGENTS.md` guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Claude Code memory and `AGENTS.md` import guidance](https://code.claude.com/docs/en/memory)
- [GitHub Copilot CLI custom instructions](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions)
- [Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md/)
- [Cursor rules and `AGENTS.md`](https://cursor.com/docs)
- [Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?](https://arxiv.org/abs/2602.11988)
- [Configuration Smells in AGENTS.md Files](https://arxiv.org/abs/2606.15828)
