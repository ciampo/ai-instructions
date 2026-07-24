# Standards and Primary Sources

Review technical claims against these primary sources instead of relying on remembered summaries. Dates record the last repository review, not a guarantee that the upstream document has not changed.

| Source | Affected guidance | Last reviewed |
| --- | --- | --- |
| [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) | Roles, states, properties, accessible names, and live-region semantics | 2026-07-21 |
| [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) | Widget patterns, keyboard interaction, focus management, and modal dialogs | 2026-07-21 |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Keyboard access, contrast, motion, reflow, input, and target-size conformance | 2026-07-21 |
| [HTML Living Standard](https://html.spec.whatwg.org/) | Native element semantics and platform behavior | 2026-07-21 |
| [CSS Logical Properties and Values Level 1](https://drafts.csswg.org/css-logical/) | Flow-relative and physical coordinate semantics | 2026-07-21 |
| [CSS Transforms Level 2](https://drafts.csswg.org/css-transforms-2/) | Individual transform properties and composition | 2026-07-21 |
| [ECMAScript language specification](https://tc39.es/ecma262/) | JavaScript language behavior | 2026-07-21 |
| [React API reference](https://react.dev/reference/react) | React APIs, refs, hooks, and version-specific behavior | 2026-07-21 |
| [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web) | Web API and CSS syntax, behavior, accessibility notes, and compatibility data | 2026-07-21 |
| [Agent Skills specification](https://agentskills.io/specification) | Skill directory layout, frontmatter, progressive disclosure, and bundled resources | 2026-07-21 |
| [Codex `AGENTS.md` guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Codex global and project instruction discovery, precedence, and size limits | 2026-07-22 |
| [Claude Code memory guidance](https://code.claude.com/docs/en/memory) | `CLAUDE.md` scope, imports, `AGENTS.md` wrappers, and rules | 2026-07-22 |
| [GitHub Copilot CLI custom instructions](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions) | Copilot instruction discovery, agent-instruction filenames, imports, and precedence limits | 2026-07-22 |
| [Antigravity CLI migration](https://antigravity.google/docs/cli/gcli-migration) | Shared `GEMINI.md` context and current global skill paths | 2026-07-23 |
| [Cursor rules](https://cursor.com/docs) | Root `AGENTS.md` support and the boundary with scoped project rules | 2026-07-22 |
| [Evaluating AGENTS.md](https://arxiv.org/abs/2602.11988) | Preliminary empirical evidence on repository context-file cost and task outcomes | 2026-07-22 |
| [Configuration Smells in AGENTS.md Files](https://arxiv.org/abs/2606.15828) | Preliminary catalog of context-bloat, lint-leakage, and conflicting-guidance risks | 2026-07-22 |
| [GitHub pull request review comments API](https://docs.github.com/en/rest/pulls/comments) | Review-comment retrieval and permissions | 2026-07-21 |
| [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) | Trust-boundary validation and syntactic and semantic checks | 2026-07-21 |
| [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) | Output encoding, sanitization, and unsafe HTML injection | 2026-07-21 |

Platform-specific discovery paths, precedence, and support status are maintained in [`platforms/manifest.json`](../platforms/manifest.json), which links the relevant vendor documentation and generates the README support table.
