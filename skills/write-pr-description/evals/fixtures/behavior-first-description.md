# Pull-request description context

Related issue: `Fixes #123`.

The repository template requires these headings:

- What
- Why
- How
- Testing Instructions

The committed diff makes a dialog remember its trigger and restore focus to that trigger after Escape closes the dialog. It adds a focused regression test. No visual styling changes.

The current remote description contains only `Fixes #123` and a manually added note: “Keyboard regression reported in the settings screen.” Preserve both pieces of context if preparing an update.

The user asked for a local draft only and explicitly prohibited updating GitHub. CI already runs lint and unit tests.
