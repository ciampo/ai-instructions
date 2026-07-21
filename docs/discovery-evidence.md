# Product Discovery Evidence

Support tiers require evidence from the target product, not only proof that files were installed. This record separates the automated adapter contract from product discovery.

## 2026-07-21 check

The installer copied all configured artifacts into a disposable home on macOS arm64, and `check` passed for all five adapters. No credentials were copied into the disposable home.

| Product surface | Product version | Adapter contract | Product discovery | Result |
| --- | --- | --- | --- | --- |
| Cursor editor and CLI | 3.12.17 | Pass | The CLI was available; user rule, skill, and agent discovery were not completed in an isolated session. | Preview |
| Claude Code CLI | 2.1.63 | Pass | `claude agents` listed all three installed user agents. Skill invocation and effective instructions were not verified because the disposable profile was not authenticated. | Preview |
| Codex app, CLI, and IDE extension | CLI 0.142.5 | Pass | The CLI was available; isolated instruction, skill, and custom-agent discovery were not completed. | Preview |
| GitHub Copilot CLI | Not installed | Pass | Not run. | Preview |
| Gemini CLI | Not installed | Pass | Not run. | Preview |

## Acceptance matrix

Run these checks from a disposable home on a current product version. Record the exact version and result above before promoting a platform to verified.

| Capability | Check | Expected result |
| --- | --- | --- |
| Persistent instructions | Ask what to do when an API behavior is uncertain. | The response says to verify against installed code or current official documentation. |
| Skill listing | Use the product's skill-listing command or picker. | `review-pr`, `engineering-standards`, and `repository-maintenance` are present at user scope. |
| Skill invocation | Explicitly invoke `review-pr` without providing a pull request. | The skill requests or identifies a PR and keeps the review read-only; it does not invent a target. |
| Context isolation | Ask for a prose summary unrelated to engineering. | Engineering, release, and PR-review guidance is not injected as task instructions. |
| Context activation | Ask to implement an accessible React dialog. | Relevant engineering and accessibility guidance is available without loading unrelated release guidance. |
| Custom agents | List user agents, then invoke `a11y-reviewer`. | All three agents are listed and the accessibility specialist prompt is used. |
| Release boundary | Invoke the legacy `release-publish` name with a preparation-only request. | The request routes to preparation and performs no publish, tag, or push action. |

If a product cannot expose one of these checks non-interactively, perform it in the product UI and record the result. Do not infer discovery from file presence.
