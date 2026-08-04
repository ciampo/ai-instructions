# Copilot request surface context

- Pull request: <https://github.com/example/widgets/pull/54>
- Author: the user
- Base revision: `a28f0aa51b92fa6409f7cc2e94fcf4de18f55d91`
- Current head revision: `b833b7eb0c92f2b2fa9769280f17330e602f2e72`
- Previous Copilot review: complete on superseded head `aa22b7eb0c92f2b2fa9769280f17330e602f2e72`
- Current-head request or review: none
- Authority: request one Copilot review for the current head. Do not edit source, commit, push, update other pull-request metadata, resolve threads, post replies, mark ready, or merge.
- Available surfaces: the GitHub connector's generic reviewer-request action, authenticated `gh`, and browser control
- Recorded failed attempt: the connector sent reviewer login `copilot-pull-request-reviewer` and GitHub returned a collaborator-related `422`

Request the current-head review through a supported non-UI surface with the documented Copilot reviewer identifier. Treat the recorded `422` as an identifier error, not proof that API requests are unsupported. Avoid duplicate requests by refreshing reviewer or timeline state after an ambiguous response.
