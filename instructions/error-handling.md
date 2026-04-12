# Error Handling

How to handle errors, loading states, and failure scenarios in application code.

## Philosophy

- **[STRONG]** Fail loudly in development, gracefully in production. Use `throw` and assertions during development. Show helpful fallback UI in production.
- Errors are not exceptional -- they are expected states that the UI must handle well.
- Every data-fetching operation has three states: loading, success, error. Design for all three from the start, not as an afterthought. When possible, use first-party React APIs and patterns (such as `useFormStatus()` or related) and optimistic updates (such as `useOptimistic()`).

## Error Boundaries

- **[STRONG]** Use React error boundaries to prevent a single component failure from crashing the entire page. Place boundaries at meaningful UI seams (route level, panel level, widget level).
- Error boundary fallback UI should be helpful: briefly explain what went wrong, offer a retry action when possible, and avoid exposing raw stack traces to users.

<details>
<summary>Example: Error boundary placement</summary>

```tsx
// Place boundaries at meaningful UI seams, not around every component.
function App() {
  return (
    <ErrorBoundary fallback={ <PageError /> }>
      <Header />
      <main>
        <ErrorBoundary fallback={ <PanelError /> }>
          <Sidebar />
        </ErrorBoundary>
        <ErrorBoundary fallback={ <PanelError /> }>
          <Content />
        </ErrorBoundary>
      </main>
    </ErrorBoundary>
  );
}
```

If `Sidebar` throws, only the sidebar shows the error fallback. `Content` and `Header` continue working.

</details>

## Loading and Empty States

- **[STRONG]** Always handle loading states explicitly. Use skeleton screens or spinners -- never leave the user staring at a blank area.
- **[PREFER]** Design meaningful empty states. "No items found" with a clear call to action is better than an empty container.
- Avoid layout shift when transitioning between loading, empty, and populated states. Reserve space for content.

## Error Messages

- **[RULE]** User-facing error messages must be actionable: explain what happened and what the user can do about it. Avoid raw error codes or technical jargon.
- **[STRONG]** Developer-facing errors (console, logs) should include: the component/module name, a concise description, and relevant context (IDs, values). Format: `ComponentName: Summary. Detail.`

## Retry and Recovery

- **[PREFER]** For transient failures (network errors, timeouts), offer a retry mechanism. Exponential backoff for automatic retries.
- **[STRONG]** Do not automatically retry deterministic client errors (`400`, `401`, `403`, `404`). These indicate a problem the client must fix, not a transient issue. Exceptions: `408 Request Timeout` and `429 Too Many Requests` may be retried with backoff — honor `Retry-After` headers when provided.
- Preserve user input across retries. Never clear a form because a submission failed.

## Logging

- **[STRONG]** Log errors with enough context to debug without reproducing. Include: error type, message, stack trace, and relevant application state.
- **[PREFER]** Use structured logging (JSON) for server-side errors. Use `console.error` with descriptive messages for client-side.
- **[RULE]** Never log sensitive data (passwords, tokens, PII).
