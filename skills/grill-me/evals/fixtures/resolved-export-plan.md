# Resolved async export plan

The interview has resolved these decisions:

- Only active team administrators can create jobs, view status, or download an
  export. Every status and download request rechecks the current role.
- A worker preserves the existing CSV format, supports up to one million rows,
  and stores a successful export for seven days.
- A user can request a new 15-minute signed URL during that retention period.
- Each team can have one active job. A duplicate request returns the active job.
- The queue retries three times. The final status exposes a safe user-facing
  error and keeps diagnostic details in restricted logs.
- Cancellation, new formats, scheduled exports, and exports larger than one
  million rows are explicit non-goals for this release.
- Metrics cover queue delay, duration, success, failure, and deletion. Alerts
  cover repeated job failures and objects that remain after their retention
  window.
- Rollout starts behind a per-team feature flag. Disabling the flag restores the
  synchronous endpoint while leaving completed objects available until normal
  deletion.
- Acceptance tests cover permission changes during a job, duplicate requests,
  retry exhaustion, signed-link renewal and expiry, the row limit, rollout
  fallback, and deletion after retention.

The only residual risk is object-storage deletion latency. Existing lifecycle
rules and the new overdue-object alert make it observable. Operations owns the
documented manual deletion procedure. There are no unresolved factual questions
or material decisions for the agreed scope.
