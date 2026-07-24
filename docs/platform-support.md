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

### Google Antigravity CLI (preview)

Antigravity CLI 1.1.6 enforces global `~/.gemini/GEMINI.md` context and imports global skills from `~/.gemini/antigravity-cli/skills/`. The installer owns those paths and migrates only its managed Gemini skill directories from `~/.gemini/skills/`; user-authored directories remain in place.

1. In an authenticated profile updated from the current revision, create a disposable workspace and confirm `~/.gemini/antigravity-cli/skills/review-pr/SKILL.md` exists before opening the client. A managed wrapper alone is not evidence that native global skills were installed.
2. Start a new session, open `/skills`, and confirm `review-pr` plus the three specialist review skills appear from the Antigravity global path.
3. Invoke `review-pr` without supplying a pull-request identifier. The authenticated profile's native global `review-pr` directory must be a nonsecret copy that includes `references/`; if the client prompts before sending a reference, approve only that displayed copy. Confirm it requests or identifies a pull request and does not invent a target or write outside the review's read-only boundary.
4. Invoke `review-accessibility` on a matching UI example and verify a general PR prompt selects `review-pr` instead.
5. Ask for the title of a review for PR 789, “Improve Dialog focus handling,” and confirm the managed title convention is applied.
6. Run the isolation and preparation-only release-boundary canaries in a disposable workspace with tools disabled where supported. In headless mode, a denied scoped file-read permission is a blocked result, not a discovery pass. Prefer an interactive, plan-mode session that approves only the displayed reads in the disposable workspace; do not use a blanket permission bypass.

### Gemini CLI (unsupported by default)

Gemini CLI is no longer an active installer surface. Individual OAuth is unavailable, and this repository has no current product evidence for a retained enterprise, Google Cloud, or paid API context. The Antigravity update migrates repository-managed global Gemini skills to the current Antigravity path without deleting user-owned files. Reintroducing Gemini requires a separately source-verified adapter and authenticated direct-skill acceptance evidence.

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

Repository-level `AGENTS.md` interoperability is implemented in [ADR 0005](decisions/0005-agents-md-canonical-artifact.md). The adapter paths remain preview until fresh product-discovery evidence covers the new wrapper artifacts.
