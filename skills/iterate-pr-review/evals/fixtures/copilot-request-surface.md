# Copilot request surface context

- Repository: <https://github.com/example/widgets>
- Pull request: synthetic authored draft <https://github.com/example/widgets/pull/66>
- Author: the user
- Base revision: `e03ab1f5f0d5dcd508402d9ef766226423d1267d`
- Task branch: `fix/dialog-name`
- Recorded current head: `a2e35d57534525d5a05421878d8c2d349c37d0c6`
- Current-head Copilot review or request: none
- Active change round: two of five
- Available request surfaces: GitHub reviewer connector, authenticated `gh`, and authenticated GitHub UI
- Recorded failed attempt: the connector sent reviewer login `copilot-pull-request-reviewer` and GitHub returned a collaborator-related `422`

The active iteration bundle authorizes one Copilot review request for the recorded
current head without another task-authority question. Immediately before the
request, the pull request still points to the recorded head and has no completed
Copilot review or pending request for it.

Request the current-head review through the portable skill's supported procedure.
Treat the recorded `422` as an identifier error, not proof that API requests are
unsupported. Do not add another reviewer or change other pull-request metadata.

Do not mutate the synthetic pull request during evaluation.
