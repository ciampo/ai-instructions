# Product Discovery Evidence

Support tiers require evidence from the target product, not only proof that files were installed. This record separates the automated adapter contract from product discovery.

## 2026-07-21 and 2026-07-22 adapter and live discovery checks

The installer first copied all configured artifacts into a disposable home on macOS arm64. The current user profiles were then refreshed with `./setup.sh update --agent '*' --yes`: 15 obsolete managed artifacts were removed and 90 current artifacts were installed or updated. `check` passed all 18 configured checks across the five adapters. Google Antigravity is a sixth product surface in the table, but does not yet have an adapter and was not part of that check.

Product canaries ran in an isolated temporary repository with tools disabled where the client supported that restriction. Authentication was reused only from the current product profile; no credentials were copied into the disposable home.

| Product surface | Product version | Source introspection | Canary result | Remaining gap | Evidence outcome |
| --- | --- | --- | --- | --- | --- |
| Cursor editor and Agent CLI | Editor 3.12.17; Agent CLI 2026.05.04-08e5280 | Pass in the editor UI: the managed core rule, 16 user skills, and three user agents were visible. The authenticated CLI listed all 14 managed skills, but its agent registry exposed only built-in agents | Pass in both clients: skill listing/invocation, isolation, activation, and release boundary. Fail in both clients: the title omitted the required `👀 [R#789]` prefix. Fail in the CLI: `a11y-reviewer` could not be invoked because it was absent from the CLI agent registry | Fix persistent-instruction activation in both clients. Either make custom agents discoverable in the CLI or split the editor and CLI support claims | Partial |
| Claude Code CLI | 2.1.63 | Pass: CLI initialization metadata contained all 14 managed skills and all three managed agents | Pass: persistent instructions, skill listing/invocation, isolation, activation, and custom-agent invocation. The prep-only release request routed to `prepare-release` and did not publish, push, or tag, but it attempted a denied auxiliary plan-file write despite the no-modification instruction | Re-run the release boundary after the auxiliary-write behavior is corrected or explicitly accepted | Partial |
| Codex app, CLI, and IDE extension | CLI 0.145.0; app 26.715.31925; IDE extension 26.715.61943 | Pass in the IDE: the extension, managed skills, and all three custom agents were visible. Partial in the CLI: skills were discovered, but custom-agent delegation was not proven | Pass in the IDE: all eight acceptance checks, including direct `a11y-reviewer` delegation. Pass in the CLI: persistent instructions, skill listing/invocation, isolation, activation, and release boundary. Fail in the CLI: custom-agent invocation produced an invalid full-history-fork error, and a context-free retry did not provide spawn evidence | Verify the app surface and fix or document the CLI custom-agent limitation; do not infer the combined surface from the complete IDE result | Partial |
| GitHub Copilot CLI | 1.0.73 | Pass for skills through `copilot skill list`; instruction and agent discovery were proven by repository-specific canaries because the CLI exposes no equivalent source listing | Pass: all seven behavior canaries, including direct `a11y-reviewer` invocation and the no-action release boundary | Complete the release verification checklist and explicitly promote the manifest tier before changing its preview status | Complete |
| Gemini CLI | 0.51.0 | Pass for skills: `gemini skills list` showed all 14 names and their installed paths | Skill listing passed. All model-backed canaries were rejected with `UNSUPPORTED_CLIENT` before execution when using individual OAuth | Gemini CLI intentionally stopped serving individual Google AI Pro, Ultra, and free users on 2026-06-18. Enterprise, Google Cloud, and paid API authentication remain separate untested contexts | Blocked for individuals |
| Google Antigravity CLI | 1.1.5 | Pass: the local command palette exposed all 14 managed skills and `agy agents` listed all three managed agents | Pass: persistent title, context isolation, context activation, direct `a11y-reviewer` invocation, and release boundary. Blocked: `review-pr` began loading correctly, then required approval to send a non-workspace reference file to the model; that export was denied | Complete `review-pr` invocation with explicit export approval or a disposable copied skill. Add a first-class adapter using the current official Antigravity paths instead of relying on legacy Gemini discovery | Partial |

The complete GitHub Copilot CLI and Codex IDE results are product-level evidence, not merely adapter passes. The Copilot evidence does not by itself change its manifest tier; promotion also requires the release verification checklist and an explicit manifest update. The combined Codex row and all other surfaces retain explicit gaps and must not be promoted based on file presence alone. No canary published, pushed, tagged, committed, or changed the isolated repository.

### Google CLI migration finding

The Gemini authentication failure is not a local login or stale-client problem. The installed `@google/gemini-cli` release was current, and the [Gemini CLI maintainer announcement](https://github.com/google-gemini/gemini-cli/discussions/27274) confirms that individual-tier access ended on 2026-06-18. Google's [Antigravity migration guide](https://antigravity.google/docs/cli/gcli-migration) directs individual users to Antigravity and defines new configuration locations. The current manifest still targets Gemini paths, so Antigravity must be modeled as a separate product surface rather than silently inheriting the Gemini support claim.

The Antigravity CLI was installed through the [official installation and authentication flow](https://antigravity.google/docs/cli/install). Its onboarding was completed with optional interaction-data collection disabled. Headless verification used plan mode, terminal sandboxing, and an isolated clean repository. A blanket permission bypass was not used.

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
