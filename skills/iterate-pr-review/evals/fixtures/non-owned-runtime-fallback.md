# Non-owned runtime fallback context

- Pull request: <https://github.com/example/widgets/pull/47>
- Author: an external contributor
- Base revision: `e18f0aa51b92fa6409f7cc2e94fcf4de18f55d91`
- Current head revision: `a433b7eb0c92f2b2fa9769280f17330e602f2e72`
- User role: reviewer only
- Branch and fix ownership: the user does not own either

The user explicitly invokes `iterate-pr-review` and asks for repeated Copilot and independent reviews. The runtime ownership precondition must route this task to the read-only `review-pr` workflow before requesting reviews or changing source.
