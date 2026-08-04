# Direct persisted-state severity context

This is a static evaluation fixture, not a live pull request. Treat it as the complete immutable boundary; do not fetch a remote branch.

- Repository: `example/review-pr-severity-fixture`
- Base revision: `cdbcae74bd58e356036469883f523b2be98eeef2`
- Head revision: `4a7f88d422535fe66b56ba33bf60afe2019fb212`
- Target audience: maintainers deciding whether the change is ready to merge
- Existing review state: no comments or reviews

The only changed area renames the persisted preference `sidebarVisible` to `showSidebar` without a migration. Existing installations can still have the previous key, and direct upgrades from that format are supported. After the upgrade, the application ignores the old value and resets the user's saved sidebar choice. No other material review domain is present.
