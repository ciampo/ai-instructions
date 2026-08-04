# Authored pull request runtime handoff context

- Pull request: <https://github.com/example/widgets/pull/52>
- Author: the user
- Base revision: `a28f0aa51b92fa6409f7cc2e94fcf4de18f55d91`
- Current head revision: `e633b7eb0c92f2b2fa9769280f17330e602f2e72`
- Requested workflow: repeated Copilot review and independent self-review
- Authority: review only. Do not edit source, commit, push, update pull-request metadata, resolve threads, post replies, mark ready, or merge.

The user explicitly invoked `review-pr`, but the authored pull request and iterative request meet the runtime preconditions for `iterate-pr-review`. Hand off before starting the ordinary read-only review and preserve the narrower action authority.
