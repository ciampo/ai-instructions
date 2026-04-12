# Skill: Refactor

A systematic workflow for codebase-wide refactors. Invoked when I say "refactor X", "rename across codebase", "migrate from A to B", or "replace all uses of X with Y."

## Dependencies

Load these instruction files before executing this skill:

- `instructions/coding-principles.md`
- `instructions/tools-and-cli.md`
- `instructions/naming-conventions.md`

## Steps

1. **Scope the change**: Identify exactly what is being refactored (a function, a pattern, a prop name, an API). Search the entire codebase for all instances. Categorize by type: application code, tests, config files, documentation, types, stories.
2. **Assess impact**: Determine the blast radius. Are there downstream consumers? Does this change affect the public API? If so, flag it and discuss the migration strategy before proceeding.
3. **Plan the order**: For large refactors, define the migration order:
   - Start with types/interfaces (so the compiler catches remaining usage).
   - Then implementation code.
   - Then tests.
   - Then documentation, stories, and config.
   - Update the CHANGELOG last.
4. **Execute in batches**: Make granular commits grouped by concern. Each commit should leave the codebase in a working state. Run the verification suite between batches, not just at the end.
5. **Handle edge cases**: When instances differ slightly (e.g., a renamed function that some callers use with different argument patterns), handle each variant explicitly. Do not force a one-size-fits-all transformation.
6. **Clean up**: After the refactor, search the codebase one more time to verify no instances were missed. Remove any temporary compatibility shims, unused imports, or dead code introduced during the migration.
7. **Verify**: Run the full verification suite (lint, type-check, build, tests). Fix any failures before presenting the result.
8. **Document**: Update relevant documentation, JSDoc, CHANGELOG entries, and migration guides as appropriate.
