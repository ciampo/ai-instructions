# Addressed review feedback

Draft replies only. The replies will be pasted into the existing GitHub threads, so the original comments and code locations are already visible.

1. The reviewer noticed that the `balance` declarations could lose to component styles because they were in the wrong cascade layer. The fix moved the relevant styles to the `compositions` layer. Chromium verification confirmed both elements now compute to `text-wrap: balance`. Commit: `6d80cd4`.
2. The reviewer noticed that shared `text-wrap: pretty` behavior for Field and Fieldset descriptions was removed. This was an oversight. The declaration was restored and all four affected elements retain their previous wrapping behavior. Commit: `6d80cd4`.

Do not repeat the investigation or verification details unless they are necessary to understand the outcome.
