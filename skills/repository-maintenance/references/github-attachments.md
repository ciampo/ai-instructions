# GitHub attachments

Prefer native `gh` commands with `--attach` for authorized screenshot or video uploads. They upload
to GitHub's attachment storage without committing media to the repository.
Uploading or changing a PR body still requires existing authorization.
Reuse existing hosted attachment URLs when available.

## Check support

- Check `gh --version` and the target command's `--help`. `--attach` arrived in
  v2.99.0 on `gh pr` and `gh issue` create, edit, and comment commands.
- Uploads require GitHub.com or a GHE.com tenant, repository write access, and a
  supported token. GitHub Enterprise Server and most GitHub App tokens are
  unsupported. Permission on a fork does not grant upload access to the base repo.
- If CLI upload is unavailable, use an exposed MCP upload tool only if its schema
  explicitly supports attachments. A body-edit or repository-file tool does not
  upload attachments. Otherwise use an available GitHub browser uploader within
  the same authorization, or report the upload blocker. Do not extract browser cookies, install an upload extension, or
  publish to another host just to avoid that fallback.

## Attach to the description

Append to an existing PR without replacing its body:

```sh
gh pr edit PR_NUMBER --repo OWNER/REPO --attach './after.png#Dialog after the fix'
```

For a specific position, read and preserve the current body, then save the updated
Markdown to `pr-body.md` with `![Dialog after the fix](./after.png)` where needed:

```sh
gh pr edit PR_NUMBER --repo OWNER/REPO --body-file pr-body.md --attach ./after.png
```

For a new draft, use the same body file and attachments with
`gh pr create --draft --title 'PR title' --body-file pr-body.md --attach ./after.png`.
Repeat `--attach` for multiple files. Paths resolve from the command's working
directory, not the body file's directory. Matching Markdown references keep their
alt text and become uploaded URLs; unreferenced attachments append to the body.
Videos use a standalone `![](./recording.mp4)` paragraph and cannot take alt text.

## Verify the result

Read back `gh pr view PR_NUMBER --repo OWNER/REPO --json url,body` and check the
uploaded references and preserved content. A partial upload can create or update
the PR and still exit nonzero. Inspect the returned URL and current body before
retrying; retry only missing files against the existing PR.

Use [GitHub's attachment guide](https://docs.github.com/en/github-cli/github-cli/attaching-files-with-github-cli),
the [CLI upload constraints](https://github.com/cli/cli/blob/trunk/skills/gh/SKILL.md#attaching-images-and-videos),
and the [edit command manual](https://cli.github.com/manual/gh_pr_edit) if installed
help leaves behavior unclear.
