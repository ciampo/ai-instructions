# Product Discovery Evidence

Support tiers require evidence from the target product, not only proof that files were installed. This record separates the automated adapter contract from product discovery.

The dated tables below are historical snapshots of the architecture tested at their stated revisions. The final specialist pilot retained accessibility, API-design, and performance as direct skills and retired the three bundled custom agents. Agent results from the earlier snapshots therefore document the decision input; they are no longer an acceptance requirement for the current source architecture.

## 2026-07-22 direct-skill verification

The active user installation was generated from `main` at `34007084d2070f5abb6ddbc11269e6568139d5ab`. Its owner installer passed `./setup.sh check --agent '*' --yes` with all 90 expected core-instruction and complete-skill artifacts current. The skills are repository-owned symlinks to that checkout; the audit branch did not overwrite them across worktrees.

The model-backed checks below used authenticated, installed clients only where available. Each prompt prohibited tool use and file changes; Codex CLI used an ephemeral read-only session. No credential was copied, no canary wrote to the workspace, and no canary published, pushed, tagged, committed, or posted a comment.

| Product surface | Product version | Source introspection | Direct-skill canaries | Remaining gap | Evidence outcome |
| --- | --- | --- | --- | --- | --- |
| Cursor editor and Agent CLI | Editor 3.12.17; Agent CLI 2026.05.04-08e5280 | Partial: the authenticated editor skill picker exposed `review-pr`, `address-pr-feedback`, `audit-dependency-update`, and additional entries. The core rule and an Agent CLI source listing were not independently inspected. | Agent CLI pass: title convention, `review-pr` target and read-only boundary, prose isolation, accessibility activation, API and performance review boundaries, and preparation-only `release-publish` routing. | Run the model canaries independently in the editor before treating the combined editor/CLI surface as complete. | Partial |
| Claude Code CLI | 2.1.63 | Blocked: `claude auth status` reports `loggedIn: false`, so no client source inspection ran. | Blocked: no model-backed check ran. | Authenticate a current Claude Code profile, then run the direct-skill matrix and resolve or document the [#43](https://github.com/ciampo/ai-instructions/issues/43) release-boundary behavior. | Blocked |
| Codex app, CLI, and IDE extension | CLI 0.145.0 | Partial: direct-skill CLI canaries ran, but no client source listing was recorded and the app and IDE extension were not inspected. | CLI pass: title convention, `review-pr` target and read-only boundary, prose isolation, accessibility activation, and API/performance review boundaries. | Independently run the app and IDE-extension checks before treating the combined surface as complete. | Partial |
| GitHub Copilot CLI | 1.0.73 | Partial: `copilot skill list` reported all 17 personal skills; core-instruction loading was not inspected in the client. | Blocked: non-interactive invocation reports no authentication information. | Authenticate the current CLI profile, run the direct-skill matrix, and complete the current cross-platform release matrix before promotion. | Blocked |
| Gemini CLI | 0.51.0 | Blocked: `gemini skills list` requires authentication, and no client source inspection ran. | Blocked: no model-backed check ran. | After [#40](https://github.com/ciampo/ai-instructions/issues/40) selects the retained Gemini policy, use a supported enterprise, Google Cloud, or paid API context for the direct-skill matrix. | Blocked |

This pass verifies the current direct-skill architecture rather than the retired custom-agent contract. It does not justify a tier promotion: Cursor and Codex combine clients that were not all independently exercised, and Claude, Copilot, and Gemini need authenticated canaries. Every manifest tier remains `preview`.

## 2026-07-21 and 2026-07-22 adapter and live discovery checks

The installer first copied all configured artifacts into a disposable home on macOS arm64. The current user profiles were then refreshed with `./setup.sh update --agent '*' --yes`: 15 obsolete managed artifacts were removed and 90 current artifacts were installed or updated. `check` passed all 18 configured artifacts per adapter, or 90 total across the five adapters. Google Antigravity CLI is a sixth product surface in the table, but does not yet have an adapter and was not part of that check.

Product canaries ran in an isolated temporary repository with tools disabled where the client supported that restriction. Authentication was reused only from the current product profile; no credentials were copied into the disposable home.

| Product surface | Product version | Source introspection | Canary result | Remaining gap | Evidence outcome |
| --- | --- | --- | --- | --- | --- |
| Cursor editor and Agent CLI | Editor 3.12.17; Agent CLI 2026.05.04-08e5280 | Pass in the editor UI: the managed core rule, 16 user skills including all 14 managed skills, and three user agents were visible. The authenticated CLI listed all 14 managed skills, but its agent registry exposed only built-in agents | Pass in both clients: skill listing/invocation, isolation, activation, and release boundary. Fail in both clients: the title omitted the required `👀 [R#789]` prefix. Fail in the CLI: `a11y-reviewer` could not be invoked because it was absent from the CLI agent registry | Fix persistent-instruction activation in both clients. Either make custom agents discoverable in the CLI or split the editor and CLI support claims | Partial |
| Claude Code CLI | 2.1.63 | Pass: CLI initialization metadata contained all 14 managed skills and all three managed agents | Pass: persistent instructions, skill listing/invocation, isolation, activation, and custom-agent invocation. The prep-only release request routed to `prepare-release` and did not publish, push, or tag, but it attempted a denied auxiliary plan-file write despite the no-modification instruction | Re-run the release boundary after the auxiliary-write behavior is corrected or explicitly accepted | Partial |
| Codex app, CLI, and IDE extension | CLI 0.145.0; app 26.715.31925; IDE extension 26.715.61943 | Pass in the IDE: the extension, managed skills, and all three custom agents were visible. Partial in the CLI: skills were discovered, but custom-agent delegation was not proven | Pass in the IDE: all eight acceptance checks, including direct `a11y-reviewer` delegation. Pass in the CLI: persistent instructions, skill listing/invocation, isolation, activation, and release boundary. Fail in the CLI: custom-agent invocation produced an invalid full-history-fork error, and a context-free retry did not provide spawn evidence | Verify the app surface and fix or document the CLI custom-agent limitation; do not infer the combined surface from the complete IDE result | Partial |
| GitHub Copilot CLI | 1.0.73 | Pass for skills through `copilot skill list`; instruction and agent discovery were proven by repository-specific canaries because the CLI exposes no equivalent source listing | Pass: all seven behavior canaries, including direct `a11y-reviewer` invocation and the no-action release boundary | Complete the release verification checklist and explicitly promote the manifest tier before changing its preview status | Complete |
| Gemini CLI | 0.51.0 | Pass for skills: `gemini skills list` showed all 14 names and their installed paths | Skill listing passed. All model-backed canaries were rejected with `UNSUPPORTED_CLIENT` before execution when using individual OAuth | Gemini CLI intentionally stopped serving individual Google AI Pro, Ultra, and free users on 2026-06-18. Enterprise, Google Cloud, and paid API authentication remain separate untested contexts | Blocked for individuals |
| Google Antigravity CLI | 1.1.5 | Pass: the local command palette exposed all 14 managed skills and the Google Antigravity CLI command `agy agents` listed all three managed agents | Pass: persistent title, context isolation, context activation, direct `a11y-reviewer` invocation, and release boundary. Blocked: `review-pr` began loading correctly, then required approval to send a non-workspace reference file to the model; that export was denied | Complete `review-pr` invocation with explicit export approval or a disposable copied skill. Add a first-class adapter using the current official Antigravity paths instead of relying on legacy Gemini discovery | Partial |

The complete GitHub Copilot CLI and Codex IDE results are product-level evidence, not merely adapter passes. The Copilot evidence does not by itself change its manifest tier; promotion also requires the release verification checklist and an explicit manifest update. The combined Codex row and all other surfaces retain explicit gaps and must not be promoted based on file presence alone. No canary published, pushed, tagged, committed, or changed the isolated repository.

### Google CLI migration finding

The Gemini authentication failure is not a local login or stale-client problem. The installed `@google/gemini-cli` release was current, and the [Gemini CLI maintainer announcement](https://github.com/google-gemini/gemini-cli/discussions/27274) confirms that individual-tier access ended on 2026-06-18. Google's [Antigravity migration guide](https://antigravity.google/docs/cli/gcli-migration) directs individual users to Antigravity and defines new configuration locations. The current manifest still targets Gemini paths, so Antigravity must be modeled as a separate product surface rather than silently inheriting the Gemini support claim.

The Antigravity CLI was installed through the [official installation and authentication flow](https://antigravity.google/docs/cli/install). Its onboarding was completed with optional interaction-data collection disabled. Headless verification used plan mode, terminal sandboxing, and an isolated clean repository. A blanket permission bypass was not used.

## 2026-07-22 pre-retirement installation and discovery checks

The active installation was generated from `main` at `6ca999444033ef095d9f8539f60c410043d930c8`. `./setup.sh check --agent '*'` verified all 90 managed artifacts across the five product surfaces. The live checks below used that installed revision; the content and authority changes being developed after it were not installed from a feature branch.

| Product surface | Product version | Adapter | Instructions | Skills | Agents | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Cursor editor and Agent CLI | Editor 3.12.17; Agent CLI 2026.05.04-08e5280 | Pass | Blocked: the Agent CLI is not authenticated; the editor UI was not exercised | Blocked: local files passed installer checks, but neither listing nor invocation was available without an authenticated client or editor UI | Blocked: invocation requires an authenticated client or editor UI | Preview |
| Claude Code CLI | 2.1.63 | Pass | Blocked: `claude auth status` reported no login | Blocked: invocation requires authentication | Pass for listing: `claude agents` reported all three user agents; invocation blocked by authentication | Preview |
| Codex app, CLI, and IDE extension | CLI 0.145.0; app and IDE extension versions not exposed | Pass | Partial pass: this fresh app task followed the installed task-title convention; the CLI and IDE extension were not independently exercised | Partial pass: this task discovered all 14 user skills and activated the relevant repository-maintenance and refactor skills; a separate CLI run was not authorized | Partial pass: all three agents were discoverable, and `a11y-reviewer` returned the repository-specific 24x24 AA and 44x44 AAA canary with W3C sources; the CLI and IDE extension were not independently exercised | Preview |
| GitHub Copilot CLI | 1.0.73 | Pass | Blocked: model invocation reported no authentication | Pass for listing: `copilot skill list` reported all 14 personal skills; invocation blocked by authentication | Blocked: invocation requires authentication | Preview |
| Gemini CLI | 0.51.0 | Pass | Blocked: no authentication method is configured | Blocked: `gemini skills list --all` did not return before it was stopped, and invocation could not start without authentication | Blocked: invocation requires authentication | Preview |

Codex context isolation also passed in a fresh delegated task: a non-engineering prose prompt produced only the requested prose, without engineering, release, or pull-request procedures. The combined Codex surface remains preview because the app version, IDE extension version, and independent CLI and IDE checks are still missing. No other support tier changes are justified by this evidence.

## 2026-07-22 specialist architecture decision

The direct accessibility skill passed explicit, implicit, negative, sibling-confusion, no-findings, material-violation, and read-only-boundary cases. Comparisons for accessibility, API design, and performance found no distinct tool, isolation, or result-quality benefit from the parallel custom-agent prompts; the prompts instead introduced evidence and output-taxonomy drift. The repository now distributes 17 skills and no custom agents. Full evidence and the decision are recorded in the [pilot](accessibility-review-pilot.md) and [ADR 0004](decisions/0004-skill-first-specialists.md).

This source-level decision and the installer lifecycle tests do not replace current in-product discovery. All five product surfaces remain preview until the revised direct-skill checks below are completed on every named client.

## Acceptance matrix

Run these checks from a disposable home on a current product version. Use product introspection where available, pair it with the repository-specific canaries below, and record pass, fail, or blocked above for each capability and client before promoting a platform to verified.

| Capability | Check | Expected result |
| --- | --- | --- |
| Installed-source introspection | Use the product's diagnostics, settings UI, or plugin/resource listing to inspect loaded instruction and skill sources. | The repository-managed user paths are visible. If the product exposes no source introspection, record this check as blocked and rely on a canary instead. |
| Persistent instructions | Ask for a task title for reviewing PR 789, “Improve Dialog focus handling,” without supplying a format. | The title starts with `👀 [R#789]` and preserves the subject, demonstrating the repository's title convention loaded. |
| Skill listing | Use the product's skill-listing command or picker. | `review-pr`, `engineering-standards`, and `repository-maintenance` are present at user scope. |
| Skill invocation | Explicitly invoke `review-pr` without providing a pull request. | The skill requests or identifies a PR and keeps the review read-only; it does not invent a target. |
| Context isolation | Ask for a prose summary unrelated to engineering. | Engineering, release, and PR-review guidance is not injected as task instructions. |
| Context activation | Ask whether a 44x44 CSS-pixel touch target is required for WCAG 2.2 Level AA. | The response identifies 24x24 with exceptions as the Level AA minimum and 44x44 as the stronger Level AAA preference from the accessibility reference. |
| Specialist reviews | List and invoke `review-accessibility`, `review-api-design`, and `review-performance` on matching prompts. | Each skill is directly available, preserves its read-only boundary, and leaves unrelated or general PR prompts to the appropriate workflow. |
| Release boundary | Invoke the legacy `release-publish` name with a preparation-only request. | The request routes to preparation and performs no publish, tag, or push action. |

If a product cannot expose one of these checks non-interactively, perform it in the product UI and record the result. A plausible generic response is not proof of discovery when source introspection or a repository-specific canary is available. Do not infer discovery from file presence.
