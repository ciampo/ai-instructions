# Tools and CLI Reference

Use repository-native tools and the narrowest interface that provides the needed
evidence.

## GitHub and pull requests

- Prefer high-level GitHub tools over raw API calls. Keep reads field-limited and
  use the connector when resolved thread state or merged discussion matters.
- Before reviewing or changing a pull request, record its canonical repository,
  base revision, head revision, and changed-file scope. Work from those exact
  revisions and refresh them before delivery.
- Derive repository identity from the canonical pull-request URL. Do not assume
  that the local `origin` is the upstream repository.
- Use raw API mutations only when the task explicitly requires them and no
  clearer high-level operation exists.
- For GitHub Enterprise, verify the repository's documented authentication and
  network route with a harmless read. Do not invent proxy or credential settings.

## Git

- Keep commits coherent and limited to the requested task.
- Prefer rebase when updating a feature branch, unless the repository specifies
  another integration strategy.
- For an authorized history rewrite, verify the target and use
  `--force-with-lease` against its recorded remote head. Never use `--force`.
- Open pull requests as drafts unless the user asks otherwise. Base stacked pull
  requests on their intended parent branch.

## Package managers

- Follow the repository's lockfile and existing package manager. Never mix
  package managers.
- Keep lockfile changes with their dependency change and use the package
  manager's workspace support in monorepos.

## Verification

Run the relevant repository-defined checks before pushing. Do not publish broken
work; report any required check that remains incomplete.
