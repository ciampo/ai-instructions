# Platform Support Policy

The installer targets user-level configuration for specific product surfaces. Repository export is explicit and never happens as a side effect of a user-level install.

## Tiers

- **Verified**: the path and format are documented by the vendor, the shared install/update/check/remove contract passes, generated output is validated, and successful instruction, skill, and agent discovery is recorded for a current product version.
- **Preview**: the adapter and lifecycle tests pass, but part of discovery or the user-level surface still requires product-specific confirmation.

Platform support tiers are limited to verified and preview. Individual capabilities can be unsupported; the manifest marks those explicitly and the installer does not generate an implied substitute.

The generated table in the README comes from [`platforms/manifest.json`](../platforms/manifest.json). Its date records the latest adapter contract check; the tier records whether product discovery is complete. Change support claims in the manifest, update its verification date and official documentation links, then run `npm run docs:generate`.

Current product versions, completed checks, and remaining acceptance work are recorded in [discovery evidence](discovery-evidence.md). A documented procedure alone is not verification evidence.

## Discovery Checks

After installation, start a new session unless the product documents live reload.

### Cursor editor and CLI (preview)

1. Open Cursor's Customize page and confirm `review-pr` and `a11y-reviewer` appear at user scope.
2. Open the slash-command menu and invoke `/review-pr`.
3. Ask Cursor to delegate an accessibility audit to `a11y-reviewer` and confirm the specialist prompt is used.
4. Confirm the core rule appears at user scope. File-backed global rules remain preview because Cursor also exposes user rules through product-managed settings.

### Claude Code CLI

1. Type `/review-pr`; Claude Code exposes skills by name and also loads them automatically when their descriptions match.
2. Run `/agents` and confirm `a11y-reviewer`, `api-design-reviewer`, and `performance-reviewer` are available.
3. Change a bundled reference, run `./setup.sh update --agent claude` when using copy mode, and verify the skill uses the updated reference.

### Codex app, CLI, and IDE extension

1. Run `/skills` or type `$` in CLI/IDE and confirm `review-pr`, `engineering-standards`, and `repository-maintenance` appear.
2. Ask Codex to delegate an accessibility audit to the `a11y-reviewer` custom agent and inspect the spawned agent thread.
3. Confirm the effective global instructions include the `Core Instructions` heading. If `~/.codex/AGENTS.override.md` exists, it intentionally takes precedence over the managed `AGENTS.md`.

### GitHub Copilot CLI

1. Invoke `/review-pr`; Copilot CLI exposes skills as slash commands and may also invoke them automatically.
2. Run `/agent` and select `a11y-reviewer`, or start a one-shot session with `copilot --agent=a11y-reviewer --prompt "Review this interface"`.
3. Ask Copilot to summarize one rule from the core personal instructions to confirm `~/.copilot/copilot-instructions.md` is loaded.

### Gemini CLI

1. Run `/skills reload`, then `/skills list`; confirm `review-pr` and the scoped standards skills appear.
2. Run `/agents reload`, then `/agents list`; confirm the three custom agents appear.
3. Invoke `@a11y-reviewer Review this interface` to force the custom subagent.
4. Ask Gemini to summarize one core instruction to confirm `~/.gemini/GEMINI.md` is loaded.

## Release Verification Checklist

Before changing a support tier or verification date:

1. Read the linked vendor documentation and release notes for every affected product.
2. Run `npm ci`, `npm run lint`, `npm run content:check`, `npm run docs:check`, `npm test`, and `npm audit --audit-level=high`.
3. Confirm the Linux, macOS, and Windows installer matrix passes. Windows support covers native Node copy mode; symlink mode depends on host permissions.
4. In a disposable home directory, exercise install, idempotent reinstall, check, list, update, and remove for the adapter.
5. Confirm a user-owned conflict is preserved and a managed stale artifact is removed only by update/remove.
6. Perform the product discovery checks above on a current release and record the date in the manifest.
7. Record the product version, exact checks, and results in `docs/discovery-evidence.md`. Promote a tier only when instructions, skills, and agents all pass.
8. Regenerate the README support table and review its diff.

Native plugin and extension distribution is evaluated in [ADR 0003](decisions/0003-native-distribution.md). Compatibility retention and removal gates are defined in the [compatibility policy](compatibility-policy.md).
