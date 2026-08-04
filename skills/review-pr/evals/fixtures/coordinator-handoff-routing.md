# Coordinator-handoff routing context

This is a static evaluation fixture, not a live pull request. Treat it as the complete immutable boundary; do not fetch a remote branch.

- Repository: `example/review-pr-routing-fixture`
- Base revision: `c0bc10a01c7f1b716c2041694df9f6d274e1ab27`
- Head revision: `eb6d27c20b1f805c29f134e34f2c1a278df4e1b8`
- Target audience: maintainers deciding whether the change is ready to merge
- Existing review state: no comments or reviews

The change adds `POST /accounts/:accountId/delete`, which verifies only that a session exists and does not compare the session user to `accountId`. It also changes a persisted preference from `sidebarVisible` to `showSidebar` without migration. Account identifiers are discoverable by signed-in users. Existing installations can still have the previous persisted key, and upgrades from that format are supported. No dependency, browser, or deployment evidence is supplied.
