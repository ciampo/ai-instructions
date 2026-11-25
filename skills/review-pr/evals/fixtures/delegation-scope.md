# Delegation scope fixtures

These are static, independent review handoffs, not live pull requests. Use only the scenario named in the prompt. Treat its supplied scope and evidence as complete for deciding the remaining review work. Do not fetch remote data. Review is read-only and delivery is chat only.

All scenarios use this immutable metadata:

- Repository: `example/review-allocation-fixture`
- Base revision: `1111111111111111111111111111111111111111`
- Head revision: `2222222222222222222222222222222222222222`
- Existing review state: no comments or reviews
- Target audience: maintainers deciding whether the change is ready to merge
- Host: subagents are available; the user has not requested separate independent reviewers

## Small cohesive change

Three files each replace one line, totaling 3 additions and 3 deletions. There are no dependency, generated, or formatting changes.

```diff
--- a/src/project-name.jsx
+++ b/src/project-name.jsx
@@
-<label htmlFor="project-name">{ __( 'Name' ) }</label>
+<label htmlFor="project-name">{ __( 'Project name' ) }</label>
--- a/test/project-name.jsx
+++ b/test/project-name.jsx
@@
-await user.type( screen.getByRole( 'textbox', { name: 'Name' } ), 'Example' );
+await user.type( screen.getByRole( 'textbox', { name: 'Project name' } ), 'Example' );
--- a/docs/projects.md
+++ b/docs/projects.md
@@
-Enter a name in the Name field and select Create.
+Enter a name in the Project name field and select Create.
```

The adjacent input remains `<input id="project-name" value={ name } onChange={ onChange } />`. The repository's `__` extracts literal strings and falls back to the English string until translated. Catalog generation is a separate release step. No other code queries this accessible name. The existing test types the value, selects Create, and asserts that the created project has that name.

The completed core review checked the label association, translation extraction convention, consumer search, passing behavior test, and documentation consistency. The simplicity handoff found no added state, abstraction, or deletion opportunity. Neither pass identified unresolved questions.

## Large mechanical change

The diff changes 400 Markdown documentation files, with 2,000 additions and 2,000 deletions. Every change replaces the typo `configuraton` with `configuration` in prose. Source, code blocks, examples, URLs, identifiers, generated files, and dependencies are unchanged.

The complete transformation is `prose.replaceAll( 'configuraton', 'configuration' )`. The core review inspected the pinned diff and verified that every hunk matches that transformation and that the excluded content is unchanged. Documentation checks pass. The simplicity handoff found no added concepts or deletion opportunities. No unresolved questions remain.

## Independent verification work

The pinned diff changes 18 source and test files, with 460 additions and 210 deletions. No generated, dependency, or formatting-only changes are included. It changes two separate packages:

- `packages/accounts` adds a bulk-delete API alongside an existing single-account route. Both accept cookie sessions or scoped bearer tokens and resolve account ownership through middleware. The new route batches calls to the shared deletion service. Its unit tests mock authentication and ownership middleware. The core review traced route registration and service calls but has not verified the real middleware combinations. The fixture environment provides the route integration suite and a test database to check own-account, foreign-account, mixed-batch, and restricted-token requests.
- `packages/preferences` moves persisted records from schema version 2 to 3 and adds a resumable migration. It uses a separate storage adapter with transaction and retry behavior. The core review checked current-format reads, but has not verified old-format migration after interruption or retry. The fixture environment provides both adapter implementations, version-2 records, and an interruption probe. These checks do not depend on the account routes or their test database.

The public API shapes, current-format happy paths, scope, and documentation were checked in the core review. The simplicity handoff found no confirmed deletion opportunity. The two outstanding checks require tracing different source and test graphs and running separate probes. There is no browser UI, localized text, or performance change in scope. No security or data-loss failure has yet been reproduced.
