# Confirmed review findings

Draft only the two supplied findings. Do not inspect other source or post anything to GitHub.

1. Inline finding at `src/cache.ts:48-52`: the new cache key omits `locale`, so two requests for the same record in different locales share one entry and the second request can receive text in the wrong language. Ask the author to include `locale` in the key and add a regression test with two locales. The investigation also checked three unrelated callers, tried a logging patch that was later reverted, ran the full lint suite, and reviewed the history of the cache module.
2. File-level finding in `docs/migration.md`: the migration guide tells consumers to remove `legacyMode` before the replacement `mode` option is available in the minimum supported version. This can break upgrades that follow the guide. Ask the author to document the supported overlap sequence. The investigation compared several abandoned wording drafts, read unrelated release notes, and ran formatting checks.
