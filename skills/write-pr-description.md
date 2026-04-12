# Skill: Write PR Description

A workflow for writing or updating a PR description. Invoked when I say "write the PR description" or "update the PR description."

## Dependencies

Load these instruction files before executing this skill:

- `instructions/writing-conventions.md`

## Steps

1. Detect the repo's PR template (look for `.github/PULL_REQUEST_TEMPLATE.md` or similar). If none exists, use the default structure: What / Why / How / Testing Instructions.
2. If updating an existing PR description, read the current description first. Preserve anything that should stay (manually added links, screenshots, reviewer context) and rewrite the rest based on the current state of the code.
3. Read all staged/committed changes to understand the scope.
4. Write a concise summary that a reviewer can grasp in 30 seconds.
5. Use `<details>` sections for: implementation details, API comparison tables, migration guides, and any extended context most readers can skip.
6. Include a "Testing Instructions" section with concrete, reproducible steps.
7. Include a "Visual Preview" section when the change is visual (mention where screenshots/videos should go).
8. Add a "TODO / Follow-ups" section when there is deferred or out-of-scope work.
9. Place related issue/PR links at the top.
10. Keep it concise. If in doubt, cut it.
