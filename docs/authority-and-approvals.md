# Authority and Approvals

Keep user intent, personal standing consent, and runtime enforcement separate.

| Layer | Purpose | Location |
| --- | --- | --- |
| Task authority | Interprets the requested outcome and its normal workflow actions. | The current prompt and matching skill |
| Standing personal authority | Records narrow consent that persists for one user. | Private user instructions or client settings |
| Runtime approval | Controls sandbox, network, and command execution. | Client configuration, command rules, and managed policy |

A runtime prompt does not mean that task authority is missing. Personal consent
does not bypass runtime enforcement. Report the layer that blocks an action
without asking the user to restate unchanged intent.

## Pull-request outcome contracts

Do not ask separately for routine steps already implied by an explicit outcome:

- Implement and open a draft pull request: branch, edit, verify, commit, push,
  and create or update the authored draft.
- Update an authored pull request or address its feedback: apply accepted fixes,
  verify, commit, and push the same branch.
- Iterate an authored pull request: request one Copilot review per current head,
  run the independent review, apply accepted fixes, verify, commit, push, and
  repeat within the round limit.
- Rebase an authored pull request: verify the target and replay, then publish the
  rewritten task branch with `--force-with-lease` against its recorded remote
  head. Never use `--force`.

These contracts also apply when the user explicitly owns another pull request's
branch and fix-and-push loop. Read-only or narrower instructions override them.
They never include public comments or reviews, thread resolution,
ready-for-review transitions, merges, releases, or unrelated pull-request
changes.

If authority is incomplete, ask one consolidated question and retain the answer
while the repository, pull request, branch, external destination, payload class,
and round limit stay unchanged. Preserve a parent workflow's later commit,
evaluation, or publication gate.

## Standing skill-evaluation authority

Standing evaluation consent is personal. A tracked repository instruction,
distributed skill, or evaluation fixture can consume that consent but cannot
grant it for every installer user.

For this repository, the personal instruction can authorize:

- version-controlled public skill content, selected public evaluation prompts
  and fixtures, and sanitized execution metadata;
- the OpenAI Codex service through existing authentication;
- exact-head reruns within the same bounded review loop; and
- updates only to the Evaluation section of the recorded authored draft pull
  request for its exact current head.

It must exclude secrets, credentials, private links or comments, untracked
files, unrelated repository data, other destinations, public comments or
reviews, thread resolution, ready-for-review transitions, merges, and releases.

For example:

```md
For ciampo/ai-instructions only, you may send version-controlled public skill
content, selected public evaluation prompts and fixtures, and sanitized
execution metadata to the OpenAI Codex service. This covers exact-head reruns in
the same bounded review loop and updating only that authored draft PR's
Evaluation section.
Exclude secrets, private or untracked data, unrelated repositories, other
destinations, comments, reviews, thread resolution, ready state, merge, release,
and unrelated PR changes.
```

Store this consent in private user-level instructions. If the installer manages
`~/.codex/AGENTS.md`, do not edit that file directly. Codex users can instead add
it as [`developer_instructions`](https://learn.chatgpt.com/docs/config-file/config-reference)
in `~/.codex/config.toml`. Start a fresh client session, confirm the loaded
instruction sources, then test one allowed public case and one synthetic denied
case without transmitting excluded data.

## Runtime command rules

Use private command rules or managed policy for stable, narrow read commands
such as `gh issue view`, `gh pr view`, `gh pr diff`, `gh pr checks`, and
`gh run view`. Do not broadly allow mutating commands, shell interpreters, or
general runtimes such as `gh`, `node`, `bash`, or `zsh`.

The current evaluator and Enterprise identity probe do not have stable entry
points narrow enough for portable allow rules. Runtime prompts can therefore
still apply even when task or standing authority is complete.
