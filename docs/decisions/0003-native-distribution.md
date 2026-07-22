# ADR 0003: Keep Native Distribution as an Adapter

- **Status:** Accepted
- **Date:** 2026-07-21

## Context

[OpenAI plugins for ChatGPT and Codex](https://learn.chatgpt.com/docs/build-plugins), [Claude Code plugins](https://code.claude.com/docs/en/plugins), [GitHub Copilot plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins), and [Gemini CLI extensions](https://geminicli.com/docs/extensions/) provide product-specific distribution systems. Those systems can improve installation and discovery inside one product, but they do not provide one shared package format for this repository's instructions, Agent Skills, and custom agents.

The repository is currently a personal, cross-platform source of truth. Adding several native packages now would create parallel version, release, rollback, and migration channels before product discovery is fully verified.

## Decision

Keep the manifest-driven installer and canonical plain-text formats as the primary distribution mechanism. Do not add native plugin or extension packages during the modernization project.

Re-evaluate a product-native adapter when all of these conditions are met:

1. A concrete audience needs managed installation beyond this repository's owner.
2. The product package can distribute every required capability, or its split with the installer is explicit and non-overlapping.
3. Version pinning, update, rollback, removal, precedence, offline behavior, and user-owned conflicts have automated coverage.
4. Product discovery succeeds from the packaged form on a current release.
5. Canonical content remains product-neutral; package metadata and generated files stay in a platform adapter.

Pilot one product before adding another. A native package must not silently replace or delete an installer-managed configuration.

## Consequences

- There is one canonical content and migration contract today.
- Product-native distribution remains possible without coupling skills to one host.
- Plugin convenience is deferred until it solves a demonstrated distribution problem and can meet the same safety bar as the installer.
