---
name: automattic-github-enterprise
description: Use only when a task explicitly targets github.a8c.com or Automattic GitHub Enterprise with gh, especially for authentication, AutoProxy, Keychain, sandbox, or network failures. Do not use for any other GitHub Enterprise host. Apply the approved configured macOS/POSIX route without changing credentials or global Git, SSH, or proxy settings.
---

# Automattic GitHub Enterprise

Use the host-specific route before diagnosing credentials or connectivity. Do not assume that an Enterprise URL or undiscovered shell wrapper configures `gh`.

## Preflight

The two probes below are harmless read-only checks. When the host can execute commands outside the sandbox and the request permits read-only access, request the required approval and run the probes directly. Do not delegate them to the user. If outside-sandbox execution is unavailable or denied, report an access-route capability blocker and stop without diagnosing the credential.

1. Confirm that the intended host is `github.a8c.com`.
2. In the configured macOS/POSIX environment, execute the listener check outside the sandbox:

   ```bash
   nc -z 127.0.0.1 8080
   ```

3. Only when the listener succeeds, execute the identity probe outside the sandbox:

   ```bash
   HTTPS_PROXY=socks5://127.0.0.1:8080 GH_HOST=github.a8c.com gh api user
   ```

4. If the identity probe succeeds, apply both environment variables directly to each intended `gh` invocation. Continue to honor the user's authority boundary for any mutating command.
5. In the result, state that this command and its outcome apply only to the configured macOS/POSIX environment. Do not prescribe the route for Windows, PowerShell, or another unconfigured environment.

## Diagnosis boundaries

- Treat sandboxed listener, `gh auth status`, Keychain, and network failures as inconclusive until the outside-sandbox preflight runs.
- Do not replace an available outside-sandbox execution route with instructions for the user to run the probes.
- If the outside-sandbox listener check fails, report the missing approved access route. Do not diagnose the credential.
- On Windows, PowerShell, or another environment where this POSIX route is not configured, do not reuse the command syntax or assume the local listener exists. Ask the user to establish the approved platform-specific route.
- Do not recommend `gh auth login`, `gh auth logout`, or global Git, SSH, credential, or proxy changes based only on a sandboxed failure.
- Do not create or depend on a custom wrapper unless the user explicitly requests one.
