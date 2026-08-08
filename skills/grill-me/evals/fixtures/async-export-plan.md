# Async export plan

## Product and repository facts

- The product is a multi-tenant service. Customer exports contain names, email
  addresses, account identifiers, and activity dates.
- Existing product policy permits only an active team administrator to request
  or download an export.
- The current synchronous endpoint calls `authorizeTeamAdmin` before it starts
  an export.
- The existing signed-download endpoint can issue a link from an export ID
  without rechecking the requester's current team role.
- The object-storage helper creates links that expire after 15 minutes. Stored
  exports expire after seven days.
- The queue retries a failed job three times and records the last error.

## Proposed plan

1. Replace the synchronous export with `POST /teams/:teamId/exports`, which
   creates a queued job and returns its ID.
2. Let a worker generate the existing CSV format and store it for seven days.
3. Let the requester poll the job and request a 15-minute download link after it
   succeeds.
4. Allow one active export per team, with a maximum of one million rows.
5. Show the recorded error after the final retry.

Cancellation and format changes are explicit non-goals. The plan does not say
whether download authorization is checked again after job creation. An
administrator can lose their role while a long export is running.
