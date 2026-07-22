# Error Handling Reference

How to handle errors, loading states, and failure scenarios in application code.

## Philosophy

- **[STRONG]** Fail loudly in development, gracefully in production. Use `throw` and assertions during development. Show helpful fallback UI in production.
- Errors are not exceptional -- they are expected states that the UI must handle well.
- Model the states that the API contract and user experience actually expose. A request may be idle, loading, refreshing stale data, successful, empty, retrying, cancelled, or failed; do not reduce those distinctions to a universal three-state model. When appropriate, use first-party React APIs and patterns (such as `useFormStatus()` or related) and optimistic updates (such as `useOptimistic()`).

## Error Boundaries

- Use React error boundaries when an isolated render failure could otherwise take down a meaningful UI region and a fallback provides a useful recovery path. Place them at meaningful seams (route, panel, or widget level) rather than treating them as a universal wrapper.
- Error boundary fallback UI should be helpful: briefly explain what went wrong, offer a retry action when possible, and avoid exposing raw stack traces to users.

<details>
<summary>Example: error boundary with fallback UI</summary>

```tsx
import { Component, type ReactNode } from 'react';

class PanelErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state: { hasError: boolean } = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if ( this.state.hasError ) {
      return this.props.fallback ?? (
        <div role="alert">
          <p>Something went wrong loading this section.</p>
          <button onClick={ () => this.setState( { hasError: false } ) }>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

</details>

## Loading and Empty States

- Communicate loading when an operation blocks useful work or takes long enough to need feedback. Keep useful prior content visible when possible; otherwise use an appropriate progress indicator or skeleton instead of an unexplained blank area.
- **[PREFER]** Design meaningful empty states. "No items found" with a clear call to action is better than an empty container.
- Avoid layout shift when transitioning between loading, empty, and populated states. Reserve space for content.

<details>
<summary>Example: handling loading, error, and success states</summary>

```tsx
function UserProfile( { userId }: { userId: string } ) {
  const { data, error, isLoading } = useFetchUser( userId );

  if ( isLoading ) {
    return <UserProfileSkeleton />;
  }

  if ( error ) {
    return (
      <div role="alert">
        <p>Could not load profile. Please try again later.</p>
      </div>
    );
  }

  if ( ! data ) {
    return <p>No profile found.</p>;
  }

  return <UserProfileCard user={ data } />;
}
```

</details>

## Error Messages

- **[RULE]** User-facing error messages must be actionable: explain what happened and what the user can do about it. Avoid raw error codes or technical jargon.
- **[STRONG]** Developer-facing errors (console, logs) should include: the component/module name, a concise description, and relevant context (IDs, values). Format: `ComponentName: Summary. Detail.`

## Retry and Recovery

- **[PREFER]** Offer a retry mechanism for failures that the API contract and failure cause identify as recoverable. Use exponential backoff for automatic retries only when the operation is safe to repeat, such as an idempotent request with an appropriate retry policy.
- Decide whether to retry from the API contract, idempotency, authentication recovery, and the observed failure cause—not a blanket HTTP-status list. A `401` may succeed after credential refresh, while a `404` can be transient in an eventually consistent system. Honor server retry guidance such as `Retry-After` when provided.
- Preserve user input across retries. Never clear a form because a submission failed.

## Logging

- **[STRONG]** Log errors with enough context to debug without reproducing. Include: error type, message, stack trace, and relevant application state.
- **[PREFER]** Use structured logging (JSON) for server-side errors. Use `console.error` with descriptive messages for client-side.
- **[RULE]** Never log sensitive data (passwords, tokens, PII).
