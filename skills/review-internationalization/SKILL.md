---
name: review-internationalization
description: Perform a read-only internationalization and localization review of user-facing text, translation behavior, locale-aware formatting, bidirectional layout, pluralization, or translator context. Use for i18n, l10n, translation, locale, RTL, date or number formatting, plural, or translatable UI review. Never edit source, commit, or write remotely.
---

# Review Internationalization

Review whether the changed experience can be translated and rendered correctly across supported languages, locales, and writing directions.

## Authority and scope

- Keep the review read-only. Inspect user-facing source, translation catalogues, localization utilities, formatting code, RTL styles, tests, and repository conventions.
- Do not assume a translation framework, supported locale set, or RTL requirement without repository evidence. Record missing locale policy or rendered-language evidence as a verification gap.
- Do not modify source strings, translations, generated catalogues, fixtures, or remote state.

## Review method

1. **Identify translatable behavior**: Inventory changed user-facing strings, placeholders, plural forms, dates, numbers, names, addresses, generated messages, and directional UI.
2. **Check message construction**: Look for concatenated sentence fragments, missing interpolation, hard-coded plural branching, ambiguous terms without translator context, and literals that bypass the repository's translation mechanism.
3. **Check locale behavior**: Verify that formatting uses the project utility or locale-aware APIs and that sorting, parsing, and displayed units match the supported contract.
4. **Check directional behavior**: Inspect flow-relative layout, directional icons, CSS, and content with unknown direction. Consider text expansion and RTL only when the changed interface or repository support makes them material.
5. **Review end-user evidence**: Prefer rendered translation, locale, long-string, and RTL coverage over key-existence assertions alone.
6. **Recommend a contextual correction**: Explain the translator, locale, or user consequence and the smallest repository-consistent fix or verification.

## Output contract

When `review-pr` or `review-coordinator` invokes this skill, return an internal handoff with confirmed findings, verification gaps, and an explicit no-findings result when applicable. Do not create a separate review artifact.

For direct use, `chat only` and `no artifact` select chat delivery. `do not write files` and `do not modify files` prohibit every local file write and also require chat delivery. In either chat mode, return the findings in chat and do not create or open a local file. Otherwise, write one portable Markdown artifact in the OS temporary directory. A finding must identify the affected localized behavior and repository or source evidence. An unobserved rendering problem, unsupported locale, or uncertain translator meaning is a verification gap, not a severity finding.

## Completion criteria

- User-facing changes are checked for message construction and locale behavior.
- Directional and expansion risks are considered only when supported by scope.
- Findings distinguish source-proven defects from missing rendered-language evidence.
- Source and remote state remain unchanged.
