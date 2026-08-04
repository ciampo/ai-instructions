---
name: review-security
description: Perform a read-only security and privacy review of a change involving untrusted input, authentication, authorization, secrets, sensitive data, dependencies, content injection, or server-side trust boundaries. Use for security, privacy, permissions, data exposure, XSS, injection, credential, or threat-model review; use audit-dependency-update for a dependency-specific audit. Do not use as a standalone general PR review; review-pr may invoke this skill as a targeted specialist pass. Never edit source, commit, or write remotely.
---

# Review Security

Review concrete trust boundaries and sensitive-data flows without presenting generic hardening advice as a vulnerability.

## Authority and scope

- Keep the review read-only. Inspect source, authorization policy, routes, data flows, configuration, dependency metadata, tests, deployment boundaries, and current primary security guidance as needed.
- Do not run intrusive scans, exploit production systems, access credentials, or expose sensitive values in artifacts.
- Treat the repository's threat model, security policy, and supported deployment configuration as authoritative. A missing threat model is a verification gap.

## Review method

1. **Map the boundary**: Identify actors, assets, entry points, trust transitions, sensitive data, and the security property the changed code must preserve.
2. **Trace data and authority**: Follow untrusted values through parsing, validation, authorization, storage, logging, output encoding, redirects, queries, and external calls. Check that authorization happens on the server or other authoritative boundary.
3. **Check concrete classes of failure**: Inspect injection and unsafe rendering, authentication and session handling, broken object or action authorization, secrets exposure, insecure defaults, excessive data disclosure, and unsafe dependency or build changes when they are in scope.
4. **Establish exploitability**: Confirm the reachable input, missing control, affected privilege or data, and consequence from source or reproducible evidence. Use primary sources for standards claims.
5. **Respect privacy**: Check collection, retention, transmission, logs, telemetry, and user-visible disclosure only when the change handles personal or sensitive data.
6. **Recommend a bounded remedy**: Tie the correction to the violated boundary and name the regression test or verification that would establish it.

## Output contract

When `review-pr` or `review-coordinator` invokes this skill, return an internal handoff with confirmed findings, verification gaps, and an explicit no-findings result when applicable. Do not create a separate review artifact.

For direct use, `chat only` and `no artifact` select chat delivery. `do not write files` and `do not modify files` prohibit every local file write and also require chat delivery. In either chat mode, return the findings in chat and do not create or open a local file. Otherwise, write one portable Markdown artifact in the OS temporary directory. A security finding must identify the reachable boundary, concrete missing or ineffective control, impact, and evidence. Possible attack paths without that evidence are verification gaps, not `[critical]` or `[major]` findings. Route dependency-release and vulnerability research to `audit-dependency-update` rather than duplicating it.

## Completion criteria

- Findings establish a concrete path from input or authority boundary to impact.
- Security and privacy claims use source or primary evidence.
- Unverified threat-model questions remain verification gaps.
- Source, credentials, and remote state remain unchanged.
