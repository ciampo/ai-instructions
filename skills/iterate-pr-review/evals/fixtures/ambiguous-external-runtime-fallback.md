# Ambiguous external runtime fallback context

- Pull request: <https://github.com/example/widgets/pull/49>
- Author: an external contributor
- Base revision: `c18f0aa51b92fa6409f7cc2e94fcf4de18f55d91`
- Current head revision: `d433b7eb0c92f2b2fa9769280f17330e602f2e72`
- User role: not stated
- Branch and fix ownership: not established

The user explicitly invokes `iterate-pr-review` and asks for repeated Copilot and independent reviews. Because neither authorship nor fix-and-push ownership is established, the runtime precondition must route this task to the read-only `review-pr` workflow before requesting reviews or changing source.
