# External write request without ownership context

- Pull request: <https://github.com/example/widgets/pull/53>
- Author: an external contributor
- Base revision: `a28f0aa51b92fa6409f7cc2e94fcf4de18f55d91`
- Current head revision: `a733b7eb0c92f2b2fa9769280f17330e602f2e72`
- User role: reviewer. The user has not stated that they own the branch or its fix-and-push loop.
- Requested actions: edit the source, commit the fixes, and push the branch

Requested write actions are not evidence of branch or fix-loop ownership. Route to the read-only `review-pr` workflow before requesting Copilot review or changing any local or remote state.
