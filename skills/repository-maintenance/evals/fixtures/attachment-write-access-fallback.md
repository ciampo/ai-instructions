# Contributor screenshot upload

The user authorizes adding inspected `./after.png` to their existing PR description on GitHub.com.
Installed `gh` is 2.100.0 and supports `--attach`. The OAuth token has WRITE permission on the contributor's fork and READ permission on the base repository.
The only exposed GitHub MCP write tool replaces a PR body string. It accepts no attachment or local-file parameter.
The authenticated GitHub browser uploader is available and can attach the file to this PR description. Preserve its existing text.
