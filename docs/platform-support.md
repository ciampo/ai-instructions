# Platform Support Policy

The installer targets user-level configuration for specific product surfaces. Repository export is explicit and never happens as a side effect of a user-level install.

## Tiers

- **Verified**: the path and format are documented by the vendor, the shared install/update/check/remove contract passes, generated output is validated, and successful discovery is recorded for every supported capability on current versions of every client named by the product surface.
- **Preview**: the adapter and lifecycle tests pass, but part of discovery or the user-level surface still requires product-specific confirmation.

Platform support tiers are limited to verified and preview. The README table lists the artifacts this repository distributes; it does not enumerate product features the repository elects not to ship. An omitted category is not a claim that the host product lacks that capability. The manifest separately records unavailable categories so the installer can preserve lifecycle and migration safety.

The generated table in the README comes from [`platforms/manifest.json`](../platforms/manifest.json). `lastAdapterChecked` records the latest filesystem and lifecycle check; it is not product-discovery evidence. Product versions, discovery dates, and capability results live only in the discovery evidence. When a row names several clients, every client must pass before the combined surface can be promoted; otherwise split the surface.

Current product versions, completed checks, and remaining acceptance work are recorded in [discovery evidence](discovery-evidence.md). The [skills-first support audit](skills-first-support-audit.md) separately records the automated installer contract for the current distribution: core instructions and complete skill directories, with no new custom-agent output. A documented procedure alone is not verification evidence.

## Discovery Checks

After installation, start a new session unless the product documents live reload.

### Cursor editor and Agent CLI (preview)

1. Open Cursor's Customize page and confirm `review-pr`, `review-accessibility`, `review-api-design`, and `review-performance` appear at user scope.
2. Open the slash-command menu and invoke `/review-pr`.
3. Invoke `review-accessibility` on an interactive UI and confirm the source-verified specialist method is used.
4. Confirm the core rule appears at user scope. File-backed global rules remain preview because Cursor also exposes user rules through product-managed settings.

### Claude Code CLI

1. Type `/review-pr`; Claude Code exposes skills by name and also loads them automatically when their descriptions match.
2. Invoke `review-accessibility` directly and confirm a general PR prompt remains with `review-pr` instead.
3. Change a bundled reference, run `./setup.sh update --agent claude` when using copy mode, and verify the skill uses the updated reference.

### Codex app, CLI, and IDE extension

1. Run `/skills` or type `$` in CLI/IDE and confirm `review-pr`, `review-accessibility`, `review-api-design`, and `review-performance` appear.
2. Invoke each specialist directly on a matching prompt and confirm `review-pr` uses them only when the domain is material.
3. Confirm the effective global instructions include the `Core Instructions` heading. If `~/.codex/AGENTS.override.md` exists, it intentionally takes precedence over the managed `AGENTS.md`.

### GitHub Copilot CLI

1. Invoke `/review-pr`; Copilot CLI exposes skills as slash commands and may also invoke them automatically.
2. Invoke `/review-accessibility` on a matching UI example and verify a non-UI prompt does not select it.
3. Ask Copilot to summarize one rule from the core personal instructions to confirm `~/.copilot/copilot-instructions.md` is loaded.

### Gemini CLI (preview; non-individual authentication only)

Gemini CLI 0.51.0 rejects individual Google AI Pro, Ultra, and free-tier OAuth with `UNSUPPORTED_CLIENT`. Run these checks only with a supported enterprise, Google Cloud, or paid API authentication context, and record that context with the result. Individual users are directed to Google Antigravity CLI, which is a separate surface tracked in [issue #40](https://github.com/ciampo/ai-instructions/issues/40).

1. Run `/skills reload`, then `/skills list`; confirm `review-pr`, the three specialist review skills, and the scoped standards skills appear.
2. Invoke `review-accessibility` on a matching UI example and verify a general PR prompt selects `review-pr`.
3. Ask Gemini to summarize one core instruction to confirm `~/.gemini/GEMINI.md` is loaded.

### Google Antigravity CLI (not yet advertised)

Antigravity is not covered by the Gemini adapter or support tier. Discovery evidence may be recorded while [issue #40](https://github.com/ciampo/ai-instructions/issues/40) establishes current native paths, lifecycle behavior, migration safety, and an explicit manifest entry.

## Release Verification Checklist

Before changing a support tier or adapter-check date:

1. Read the linked vendor documentation and release notes for every affected product.
2. Run `npm ci`, `npm run lint`, `npm run content:check`, `npm run docs:check`, `npm test`, and `npm audit --audit-level=high`.
3. Confirm the Linux, macOS, and Windows installer matrix passes. Windows support covers native Node copy mode; symlink mode depends on host permissions.
4. In a disposable home directory, exercise install, idempotent reinstall, check, list, update, and remove for the adapter.
5. Confirm a user-owned conflict is preserved and a managed stale artifact is removed only by the lifecycle command that performs the relevant migration cleanup.
6. Update `lastAdapterChecked` only after steps 2-5 pass for that adapter.
7. Perform the product discovery checks above on a current release of every client named by the product surface.
8. Record the date, exact version, and a pass, fail, or blocked result for each supported capability and client in `docs/discovery-evidence.md`. Promote a tier only when every supported capability passes.
9. Regenerate the README support table and review its diff.

Native plugin and extension distribution is evaluated in [ADR 0003](decisions/0003-native-distribution.md). Compatibility retention and removal gates are defined in the [compatibility policy](compatibility-policy.md).
