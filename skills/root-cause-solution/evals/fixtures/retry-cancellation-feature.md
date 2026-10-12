# Cancellation for retried requests

The user requests a read-only design recommendation for a new feature. The existing retry runner satisfies its current contract. No defect has been reported or reproduced.

The following is the complete source relevant to the decision. `transport` returns a promise. `clock` provides `setTimeout` and `clearTimeout` with the usual timer contract. The injected clock permits deterministic checks without browser-native behavior.

```js
export function createRetryRunner(transport, clock) {
  return function start(input, publish, reportFailure) {
    let retriesRemaining = 1;

    async function attempt() {
      try {
        const result = await transport(input);
        publish(result);
      } catch (error) {
        if (retriesRemaining-- > 0) {
          clock.setTimeout(attempt, 100);
        } else {
          reportFailure(error);
        }
      }
    }

    void attempt();
  };
}
```

The existing contract starts a request immediately, retries once after a rejection, publishes a successful result, and reports failure only after the retry fails. Existing callers ignore the return value. Several widgets share one runner, and a widget may start overlapping operations.

The requested feature lets callers cancel one operation through a handle returned by `start`. Cancellation must:

- Prevent a pending retry from starting.
- Request abort of an active transport through a supplied `AbortSignal`.
- Prevent result or failure callbacks after cancellation, including late completion from a transport that ignores abort.
- Leave other operations running, including operations started through the same runner.

Cancellation is optional and repeatable. Existing callers that do not use it must retain the original behavior. Supported transports accept an optional signal as a second argument; some ignore it. Cancellation signals are local to each operation. No global cancellation policy or new retry configuration was requested.

The runner owns the retry timer and starts every transport attempt. Callers currently have neither the timer handle nor access to a transport abort signal. The user proposes keeping cancellation flags in each widget. No candidate implementation or feature verification has run.
