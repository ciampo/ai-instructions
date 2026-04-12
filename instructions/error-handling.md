# Error Handling

How to handle errors, loading states, and failure scenarios in application code.

## Philosophy

- **[STRONG]** Fail loudly in development, gracefully in production. Use `throw` and assertions during development. Show helpful fallback UI in production.
- Errors are not exceptional -- they are expected states that the UI must handle well.
- Every data-fetching operation has three states: loading, success, error. Design for all three from the start, not as an afterthought.

## Error Boundaries

- **[STRONG]** Use React error boundaries to prevent a single component failure from crashing the entire page. Place boundaries at meaningful UI seams (route level, panel level, widget level).
- Error boundary fallback UI should be helpful: briefly explain what went wrong, offer a retry action when possible, and avoid exposing raw stack traces to users.

## Loading and Empty States

- **[STRONG]** Always handle loading states explicitly. Use skeleton screens or spinners -- never leave the user staring at a blank area.
- **[PREFER]** Design meaningful empty states. "No items found" with a clear call to action is better than an empty container.
- Avoid layout shift when transitioning between loading, empty, and populated states. Reserve space for content.

## Error Messages

- **[RULE]** User-facing error messages must be actionable: explain what happened and what the user can do about it. Avoid raw error codes or technical jargon.
- **[STRONG]** Developer-facing errors (console, logs) should include: the component/module name, a concise description, and relevant context (IDs, values). Format: `ComponentName: Summary. Detail.`
- **[PREFER]** For form validation, show errors inline next to the relevant field, not in a generic banner at the top.

## Retry and Recovery

- **[PREFER]** For transient failures (network errors, timeouts), offer a retry mechanism. Exponential backoff for automatic retries.
- **[STRONG]** Do not retry on 4xx client errors (bad request, unauthorized, forbidden). These indicate a problem the client must fix, not a transient issue.
- Preserve user input across retries. Never clear a form because a submission failed.

## Logging

- **[STRONG]** Log errors with enough context to debug without reproducing. Include: error type, message, stack trace, and relevant application state.
- **[PREFER]** Use structured logging (JSON) for server-side errors. Use `console.error` with descriptive messages for client-side.
- **[RULE]** Never log sensitive data (passwords, tokens, PII).
