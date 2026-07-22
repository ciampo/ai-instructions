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
