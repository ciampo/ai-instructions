# Ledger pagination fix

This offline snapshot represents a PR for `https://ledger.example.invalid/cli` between synthetic revisions `ad13e60` (base) and `71dd644` (head). The project uses Summary and Testing Instructions.

The current PR description says “Raise the default page size to 50” and asks reviewers to list the first page. That change was dropped. Both revisions use the same default and filter the first page by account. In `src/entries/page.ts`, the final diff restores the account from the continuation token. The base resumes from the correct position but reads subsequent entries across all accounts.

Both revisions support `ledger demo load NAME` and `ledger entries [--account NAME] [--limit N] [--after TOKEN]`. Requesting one entry prints its ID and account plus a continuation token if more entries are available. A new demo store is empty.

The head integration test passed. It seeds one account's entries on either side of another account's entry, then checks the resumed page. There is no recorded base run or manual CLI run.

The file history for `src/entries/page.ts` links to the [archived PR that introduced continuation tokens](pagination-fix/pr-18.md).
