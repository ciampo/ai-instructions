# User question

Why didn't the deployment complete, and what do we know so far?

## Available evidence

- Deployment stopped during the database migration.
- The log records error `DB-104`, but it does not identify the root cause.
- No retry has run.
- The next scheduled step is to inspect the failed query.
