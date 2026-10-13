# Pull-request description context

Draft locally only. Do not write to GitHub. There is no PR template or existing description to preserve.

Related issue: `Fixes #456`.

The completed diff includes `locale` in a record cache key. Previously, requests for the same record in different languages shared an entry, so a later request could receive text in the wrong language. Each language now has its own entry.

The new key format is incompatible with persisted entries. Deployments must clear the persisted record cache before starting the new version. The PR does not automate that step. This migration requirement must be visible to reviewers.

Useful implementation context: the key contains the record ID and locale, and encodes each field's length before its value. This keeps values containing the separator from accidentally producing the same key. The encoder is shared by reads and writes. There is no public API change.

Manual verification: on the record screen, load record 7 in English, switch to Italian, and load record 7 again. The second response must contain Italian text. Reload in English and confirm the English text is still correct.

CI already runs lint, type checks, and unit tests. Investigation notes also list three abandoned encoders and unrelated callers; these do not help a reviewer assess the final change.
