---
name: engineering-standards
description: Apply scoped implementation standards for TypeScript, JavaScript, CSS, React, design systems, accessibility, internationalization, security, performance, naming, and error handling. Use when changing or reviewing relevant code.
---

# Engineering Standards

Load only the references relevant to the technologies and risks in the current task:

- Read [coding principles](references/coding-principles.md) for implementation or API work.
- Read [naming conventions](references/naming-conventions.md) when adding, moving, or renaming public concepts or files.
- Read [accessibility](references/accessibility.md) for user interfaces, interaction, semantics, focus, keyboard behavior, motion, contrast, or touch targets.
- Read [design-system components](references/design-system-components.md) for reusable component-library or design-token work.
- Read [error handling](references/error-handling.md) for data fetching, async operations, recovery, fallbacks, or logging.
- Read [internationalization](references/i18n.md) for user-facing text, formatting, bidirectional layout, or locale-sensitive behavior.
- Read [performance](references/performance.md) only when the change can affect bundle size, loading, rendering, layout, media, or measured runtime cost.
- Read [security](references/security.md) for untrusted data, authentication, authorization, secrets, dependencies, content injection, or server-side boundaries.

Do not apply framework-specific guidance when the target repository does not use that framework. The target repository's explicit conventions take precedence over stylistic defaults in these references.

Apply these standards only within the authority of the calling request. A review remains read-only, while an implementation request may modify the scoped local files; neither action independently authorizes a commit or remote write.
