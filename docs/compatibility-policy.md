# Compatibility Policy

The installer supports direct updates from the pre-modernization layout recorded by `tests/fixtures/pre-modernization-install.json`. Compatibility code remains until an explicit support-floor change is documented and tested.

## Retained surfaces

| Surface | Policy |
| --- | --- |
| `setup.sh` | Keep as the stable POSIX entrypoint. There is no planned removal date. |
| `--only personas` | Keep as a deprecated alias for `agents` through at least 2026-10-21 and one tagged major release after the modernization stack merges. |
| Retired specialist agents | Keep managed-marker and repository-owned symlink cleanup at each former agent destination through the supported upgrade window. Do not recreate the agents. |
| Legacy Cursor and Codex destinations | Keep cleanup adapters while direct upgrades from the frozen baseline are supported. Their maintenance cost is small and removing them would strand old installations. |
| `release-publish` skill | Keep as a deprecated route through at least 2026-10-21 and one tagged major release after the modernization stack merges. |
| Managed-marker recognition | Keep for every installation format still present in a supported upgrade fixture. |

## Removal gates

A compatibility surface can be removed only when all of these are true:

1. The time and release window above has elapsed.
2. The changelog and migration guide announce the removal and replacement.
3. The repository's supported upgrade floor advances to a newer frozen fixture.
4. Default and copy-mode upgrades from that new floor pass on the CI operating-system matrix.
5. User-owned conflicts remain preserved and `check` gives an actionable failure for installations older than the supported floor.

Do not delete historical upgrade coverage merely because the current layout is stable. Replace it with coverage for the newly declared support floor.
