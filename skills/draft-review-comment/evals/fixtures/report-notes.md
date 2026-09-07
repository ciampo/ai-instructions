# Supplied review notes

Draft a full report from these checked facts only. Do not fetch PR data, inspect source, or post anything.

- PR: <https://github.com/example/widgets/pull/44>, title: Cache translated records.
- Base: `5555555555555555555555555555555555555555`; head: `6666666666666666666666666666666666666666`.
- Overall scope: The PR adds a cache for translated records. Changes are needed for the new language mix-up below. All review bodies, threads, replies, and PR conversation comments were checked against this head.
- Confirmed new [major] finding at `src/cache.ts:48-52`: "The locale-agnostic cache identity aliases localized payloads across consumers; incorporate `locale` into key derivation and assert isolation." In concrete terms, requests for the same record in different languages share a cache entry, so the second request can get text in the wrong language. Include `locale` in the key and test two locales.
- Earlier [minor] feedback at <https://github.com/example/widgets/pull/44#discussion_r301> remains open and unaddressed: the guide omits the supported minimum version. That thread already asks for the version. The next action is to add it to `docs/migration.md`. There is no new information to reply with and no need to repeat the existing request.
- Earlier feedback at <https://github.com/example/widgets/pull/44#discussion_r302> remains open, but commit `abc1234` has fixed it by retaining explicit false. The user authored that fix. A reply can report that outcome.
- The investigation traced three unrelated callers, tried a logging patch, reviewed cache history, and ran lint. Those steps add no evidence needed for the report.

The author knows `locale` and cache keys. They do not need terminology such as identity aliasing or isolation assertions to understand the requested fix.
