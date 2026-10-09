# PR screenshot update

Target: `ciampo/ai-instructions` PR 123. The user authorizes updating its description.
Installed `gh` is 2.100.0; `gh pr edit --help` exposes repeatable `--attach` and `--body-file`. The target is GitHub.com, authentication uses an OAuth token, and repository permission is ADMIN.
The supplied files `./before.png` and `./after.png` exist and have been inspected. They show a dialog before and after a focus fix.
Current body: `Fixes #12`, then What, Why, How, Testing Instructions, and Visual Preview sections. Preserve the manual note `Keep the keyboard regression steps.` and existing hosted image `![Settings screen](https://github.com/user-attachments/assets/existing-settings)`.
Add before and after images in Visual Preview. Browser automation and GitHub MCP body editing are also available. No comments or repository-media commits were requested.
