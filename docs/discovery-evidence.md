# Product Discovery Evidence

Support tiers require evidence from the target product, not only proof that files were installed. This record separates the automated adapter contract from product discovery.

## 2026-07-21 adapter check and discovery attempt

The installer copied all configured artifacts into a disposable home on macOS arm64, and `check` passed for all five adapters. No credentials were copied into the disposable home.

| Product surface | Product version | Adapter | Instructions | Skills | Agents | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Cursor editor and Agent CLI | Editor 3.12.17; Agent CLI 2026.05.04-08e5280 | Pass | Not run | Not run | Not run | Preview |
| Claude Code CLI | 2.1.63 | Pass | Not run: disposable profile was not authenticated | Not run: disposable profile was not authenticated | Pass: `claude agents` listed all three installed user agents | Preview |
| Codex app, CLI, and IDE extension | CLI 0.142.5; app and IDE extension versions not recorded | Pass | Not run | Not run | Not run | Preview |
| GitHub Copilot CLI | Not installed | Pass | Not run | Not run | Not run | Preview |
| Gemini CLI | Not installed | Pass | Not run | Not run | Not run | Preview |

No product surface has complete discovery evidence. Adapter passes above prove only that the installer produced and checked the configured files.

## 2026-07-22 active installation and discovery checks

The active installation was generated from `main` at `6ca999444033ef095d9f8539f60c410043d930c8`. `./setup.sh check --agent '*'` verified all 90 managed artifacts across the five product surfaces. The live checks below used that installed revision; the content and authority changes being developed after it were not installed from a feature branch.

| Product surface | Product version | Adapter | Instructions | Skills | Agents | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Cursor editor and Agent CLI | Editor 3.12.17; Agent CLI 2026.05.04-08e5280 | Pass | Blocked: the Agent CLI is not authenticated; the editor UI was not exercised | Blocked: local files passed installer checks, but neither listing nor invocation was available without an authenticated client or editor UI | Blocked: invocation requires an authenticated client or editor UI | Preview |
| Claude Code CLI | 2.1.63 | Pass | Blocked: `claude auth status` reported no login | Blocked: invocation requires authentication | Pass for listing: `claude agents` reported all three user agents; invocation blocked by authentication | Preview |
| Codex app, CLI, and IDE extension | CLI 0.145.0; app and IDE extension versions not exposed | Pass | Partial pass: this fresh app task followed the installed task-title convention; the CLI and IDE extension were not independently exercised | Partial pass: this task discovered all 14 user skills and activated the relevant repository-maintenance and refactor skills; a separate CLI run was not authorized | Partial pass: all three agents were discoverable, and `a11y-reviewer` returned the repository-specific 24x24 AA and 44x44 AAA canary with W3C sources; the CLI and IDE extension were not independently exercised | Preview |
| GitHub Copilot CLI | 1.0.73 | Pass | Blocked: model invocation reported no authentication | Pass for listing: `copilot skill list` reported all 14 personal skills; invocation blocked by authentication | Blocked: invocation requires authentication | Preview |
| Gemini CLI | 0.51.0 | Pass | Blocked: no authentication method is configured | Blocked: `gemini skills list --all` did not return before it was stopped, and invocation could not start without authentication | Blocked: invocation requires authentication | Preview |

Codex context isolation also passed in a fresh delegated task: a non-engineering prose prompt produced only the requested prose, without engineering, release, or pull-request procedures. The combined Codex surface remains preview because the app version, IDE extension version, and independent CLI and IDE checks are still missing. No other support tier changes are justified by this evidence.

## Acceptance matrix

Run these checks from a disposable home on a current product version. Use product introspection where available, pair it with the repository-specific canaries below, and record pass, fail, or blocked above for each capability and client before promoting a platform to verified.

| Capability | Check | Expected result |
| --- | --- | --- |
| Installed-source introspection | Use the product's diagnostics, settings UI, or plugin/resource listing to inspect loaded instruction, skill, and agent sources. | The repository-managed user paths are visible. If the product exposes no source introspection, record this check as blocked and rely on a canary instead. |
| Persistent instructions | Ask for a task title for reviewing PR 789, “Improve Dialog focus handling,” without supplying a format. | The title starts with `👀 [R#789]` and preserves the subject, demonstrating the repository's title convention loaded. |
| Skill listing | Use the product's skill-listing command or picker. | `review-pr`, `engineering-standards`, and `repository-maintenance` are present at user scope. |
| Skill invocation | Explicitly invoke `review-pr` without providing a pull request. | The skill requests or identifies a PR and keeps the review read-only; it does not invent a target. |
| Context isolation | Ask for a prose summary unrelated to engineering. | Engineering, release, and PR-review guidance is not injected as task instructions. |
| Context activation | Ask whether a 44x44 CSS-pixel touch target is required for WCAG 2.2 Level AA. | The response identifies 24x24 with exceptions as the Level AA minimum and 44x44 as the stronger Level AAA preference from the accessibility reference. |
| Custom agents | List user agents, then invoke `a11y-reviewer`. | All three agents are listed and the accessibility specialist prompt is used. |
| Release boundary | Invoke the legacy `release-publish` name with a preparation-only request. | The request routes to preparation and performs no publish, tag, or push action. |

If a product cannot expose one of these checks non-interactively, perform it in the product UI and record the result. A plausible generic response is not proof of discovery when source introspection or a repository-specific canary is available. Do not infer discovery from file presence.
