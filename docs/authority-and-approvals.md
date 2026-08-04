# Authority and Approvals

Keep user intent, personal standing consent, and runtime enforcement separate. A
workflow can establish that the user wants an action without changing what the
host sandbox, approval reviewer, managed policy, or command rules permit.

## Authority layers

| Layer | Purpose | Location |
| --- | --- | --- |
| Task authority | Interprets the requested outcome and its normal workflow actions. | The current prompt and the matching skill |
| Standing personal authority | Records narrow consent that should persist across tasks for one user. | A private user-level instruction or client setting, never a tracked shared instruction or distributed skill |
| Runtime approval | Controls whether a command or tool may cross a sandbox or network boundary. | Client configuration, command rules, approval reviewer, and managed policy |

A runtime prompt does not prove that user intent is missing. A standing personal
instruction does not bypass a runtime prompt. Report the layer that blocked the
action instead of asking the user to grant the same task authority again.

## Routine pull-request authority

Treat these explicit requests as bounded outcome contracts unless the user adds
a narrower limit:

| Request | Included actions | Still excluded |
| --- | --- | --- |
| Implement a change and open a draft pull request | Create the task branch, edit, verify, make coherent commits, push that branch, and create or update the authored draft pull request | Public comments or reviews, thread resolution, ready-for-review transitions, merge, release, and unrelated metadata |
| Implement or update a change on an authored pull request, or address its feedback | Apply accepted fixes, verify them, make coherent commits, push the same task branch, and refresh the resulting head | Read-only inspection remains read-only; branch integration or history rewrites unless requested, posted replies, thread resolution, ready-for-review transitions, merge, and release |
| Iterate an authored pull request | Delegate one exact-head Copilot request per round to the dedicated reviewer workflow, consume its evidence, run the independent review, apply accepted fixes, verify, commit, push, and repeat within the configured round limit | Request mechanics in the portable skill, other reviewer mutations, posting the agent's own public review or replies, resolving threads, marking ready, merging, releasing, and unrelated pull-request changes |
| Rebase an authored pull request, then iterate it | The iteration bundle plus one verified rebase and an exact `--force-with-lease` update of that pull request's branch | Plain `--force`, another branch, a history rewrite without the requested rebase, and every excluded iteration action |

For another author's pull request, remote fix actions require explicit ownership
of its branch and fix-and-push loop. A request that explicitly prohibits commits,
pushes, or remote writes overrides the bundle. If an unchanged workflow is
missing authority, ask one consolidated question before the first affected
action and retain the answer while the repository, pull request, branch,
destination, payload class, and round limit stay unchanged.

## Standing skill-evaluation authority

Standing evaluation consent is personal. Do not encode it as authority in this
repository's tracked `AGENTS.md`, a distributed skill, an evaluation fixture, or
another shared artifact. Those files can document and consume consent, but they
cannot grant it for every installer user.

The narrow personal instruction should identify all of these boundaries:

- Repository: `https://github.com/ciampo/ai-instructions` only.
- Payload: version-controlled public skill content, selected public evaluation
  prompts and fixtures, and sanitized execution metadata.
- Destination: the OpenAI Codex service through existing authentication only.
- Reruns: the same bounded review loop after in-scope revisions or focused case
  selection changes.
- Pull-request write: only update the Evaluation section of the existing authored
  draft pull request recorded by the active bounded review loop, after its task
  branch and exact head are verified.
- Exclusions: secrets, credentials, private links or comments, untracked files,
  unrelated repository data, another destination, public comments or reviews,
  thread resolution, ready-for-review transitions, merge, and release.

Use wording such as:

```md
For ciampo/ai-instructions only, you may send version-controlled public skill
content, selected public evaluation prompts and fixtures, and sanitized execution
metadata to the OpenAI Codex service through existing authentication. This consent
covers exact-head reruns within the same bounded review loop. It excludes secrets,
credentials, private links or comments, untracked files, unrelated repository
data, and every other destination. You may update only the Evaluation section of
the existing authored draft pull request recorded by the active bounded review
loop, after verifying its task branch and exact head. Do not post comments or
reviews, resolve threads, mark the pull request ready, merge, or release.
```

Store that text in a private user-level instruction layer. When this repository's
installer manages `~/.codex/AGENTS.md`, do not edit the managed file. Codex users
can add it as [`developer_instructions`](https://learn.chatgpt.com/docs/config-file/config-reference)
in `~/.codex/config.toml`. A user who owns their complete
`~/.codex/AGENTS.md` can place it there instead. Do not create
`~/.codex/AGENTS.override.md` only to append this rule: Codex uses the override
instead of the managed global file, not in addition to it.

Start a fresh client session after changing personal instructions. Confirm which
instruction and configuration sources loaded, then exercise one allowed public
case and one denied private, untracked, unrelated-repository, or new-destination
case. Keep the denied case synthetic; do not transmit excluded data merely to
prove that the boundary works.

## Recent pre-authorization decisions

| Action | Safe treatment | Canonical location |
| --- | --- | --- |
| Branch, edit, verify, commit, push, and open an authored draft pull request | Include in an explicit implementation-and-open-PR task | `repository-maintenance` |
| Accepted fixes, verification, commits, and pushes while addressing feedback on an authored or explicitly owned branch | Include in the feedback task; respect local-only or no-push limits | `address-pr-feedback` |
| Accepted fixes, verification, commits, and pushes within the review-round limit | Include in the authored iteration bundle | `iterate-pr-review` |
| Exact-head Copilot reviewer requests | Include authority to delegate one request per recorded head without another question; keep connector, CLI, and browser mechanics in the dedicated reviewer workflow | `iterate-pr-review` authority contract and the dedicated workflow that owns the reviewer integration |
| Exact-lease history update after an explicitly requested rebase | Include only after patch-replay and remote-head verification | `repository-maintenance` and `iterate-pr-review` |
| Public tracked skill-evaluation data sent to the OpenAI Codex service, including in-scope exact-head reruns | Record as narrow standing personal consent | Private user-level instructions or client settings |
| Update the recorded authored draft pull request's Evaluation section with exact-head results | Include only when matching standing consent names that write and the active pull request, task branch, and head match | Personal consent, consumed by `write-pr-description` |
| Read-only GitHub, CI, and Enterprise preflight commands | Task authority is already read-only; use a runtime allow rule only for a stable command shape | Private command rules or managed policy |
| Public comments, replies, or agent-authored reviews; thread resolution; ready-for-review; merge; release; unrelated metadata; plain force push | Do not pre-authorize through these workflow bundles | Require a new explicit task request |

## Runtime command rules

Codex [command rules](https://learn.chatgpt.com/docs/agent-configuration/rules)
are suitable for stable, narrow commands whose arguments cannot
turn a read into a write. Examples include `gh issue view`, `gh pr view`,
`gh pr diff`, `gh pr checks`, and `gh run view`. Keep mutating commands such as
`gh pr edit`, broad `gh api`, generic `node`, shell wrappers, and commands with
environment assignments out of an allow rule.

The current model-evaluation runner and Automattic Enterprise identity probe do
not provide a stable command shape that is narrow enough for a portable allow
rule. The evaluator path is revision-specific, while the Enterprise probe uses
command-local environment assignments. Keep runtime approval independent until a
stable, audited entrypoint exists. If one is added later, match that exact
entrypoint rather than allowing `node`, `gh`, `bash`, or `zsh` broadly.

Managed policy can still require a prompt or forbid an allowed command. Do not
weaken `requirements.toml`, sandbox settings, or approval-reviewer policy to make
task authority appear successful.
