# CLI-first feedback context

- Pull request: <https://github.com/ciampo/ai-instructions/pull/47>
- Repository: <https://github.com/ciampo/ai-instructions>
- Base revision: `f03ab1f5f0d5dcd508402d9ef766226423d1267d`
- Head revision: `52e35d57534525d5a05421878d8c2d349c37d0c6`

## Recorded feedback

1. **`skills/review-pr/SKILL.md:12-13`** — "Step 1 refers to captured PR metadata before Step 2 captures it. Make the dependency order explicit."
2. **`skills/address-pr-feedback/SKILL.md:17`** — "Before acting on feedback, refresh both captured PR boundaries and rebuild the snapshot if either changed."
3. **`skills/address-pr-feedback/SKILL.md:17`** — "Fetch the ordinary PR conversation and all inline review comments before categorizing feedback."

## Source excerpts

```md
1. Read the review references. In the next step, identify the repository and diff base from fresh PR metadata.
2. Capture the CLI-first snapshot and limit review to that PR's own diff.
```

```md
2. Gather feedback from a CLI-first snapshot. Before categorizing or acting, re-read PR metadata; if either captured SHA changed, discard and rebuild the snapshot.
```

First capture the PR metadata and source at both recorded boundaries. Re-read the metadata immediately before changing code; if either boundary changed, discard the initial comments and source snapshot and collect a new one. Draft replies locally only.

## Verification contract

- Required: run focused source assertions that prove metadata is captured before use, all recorded feedback is collected, and changed boundaries rebuild the snapshot.
- Optional: run broader Markdown lint only when the repository configuration is already present. Do not reconstruct missing configuration for this self-contained fixture.
