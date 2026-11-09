# Local browser execution

Personal environment guidance for this user's local macOS browser checks in Codex. It applies to browser unit tests, E2E tests, screenshots, and diagnostic scripts that launch local browser processes. Do not copy these host-specific instructions into an upstream project's testing policy or apply them to Linux, Windows, cloud runners, or another unverified host.

## Launch through the approved route

Sandboxed browser startup failed on this host during the 2026-11-09 investigation. Before the first local browser launch, use the execution tool's approval mechanism to request the scoped runner or diagnostic command outside the agent sandbox. In Codex, use `exec_command` with `sandbox_permissions: "require_escalated"` and a justification naming the browser check. Reuse an existing approval only within its granted scope.

- Inspect the repository's existing test command and installed browser tooling first. Keep the check scoped and headless unless the task explicitly requires a visible browser.
- If a REPL cannot request outside-sandbox execution, put the check in a temporary script and run that script through the execution tool. A REPL's availability does not establish its browser-launch permissions.
- Reuse a working exposed browser session when appropriate. Do not replace a working connector or computer-use browser with a new local launch just to apply this guidance.
- These instructions do not grant execution permission. If escalation is unavailable or denied, report the route blocker. Do not disable approval controls, broaden command rules, or suggest blanket allowances for `node`, `npm`, or a shell.
- Preserve the browser's own security settings. Execution outside the agent sandbox does not call for `--no-sandbox` or disabling Firefox's content sandbox.

[Codex command rules](https://learn.chatgpt.com/docs/agent-configuration/rules) govern outside-sandbox execution. Keep any approval specific to the intended command and task.

## Recognize startup failures

The investigation observed these failures before test assertions could run:

| Signature | Observed context | Next step |
| --- | --- | --- |
| Chromium `bootstrap_check_in` with `Permission denied (1100)` | Sandboxed browser startup | Stop retrying under the same restrictions. Request the scoped outside-sandbox route. |
| WebKit `Playwright.app` or Firefox abort in macOS `_RegisterApplication` | Sandboxed browser startup | Use the approved route. Do not cycle through other engines inside the same sandbox. |
| Firefox `Could not find profile folder`, exiting with code 1 | Also reproduced outside the sandbox with an existing temporary profile | Check the separate application-data case below. |

These signatures are evidence from this host, not diagnoses for every browser crash. If the approved route fails differently, retain the relevant launch log and investigate that failure. Report a startup blocker separately from a failed assertion. A browser that never launched provides no passing or failing test result.

## Conditional Firefox application-data workaround

On 2026-11-09, Firefox 155 bundled with Playwright 1.63.0 failed outside the sandbox with `Could not find profile folder`. An explicit, existing temporary profile failed too. A fresh `MOZ_APP_DATA` directory allowed startup and a page interaction. Access to Firefox's shared application-data directory returned `EPERM` outside the sandbox. [Mozilla bug 2060476](https://bugzilla.mozilla.org/show_bug.cgi?id=2060476) documents the matching macOS startup issue.

Use this fallback only for the matching failure on the affected local environment. Check the installed versions and current launch result after upgrades. Do not make it a permanent default for Firefox or other hosts.

1. Create a unique disposable application-data directory for each Firefox process. Keep Playwright's temporary test profile separate.
2. Pass `MOZ_APP_DATA` only to that Firefox launch, preserving the inherited environment. Do not export it globally or change the user's Firefox data, macOS privacy permissions, or persistent browser configuration.
3. Run the actual requested check through the approved execution route. A launch smoke check alone does not verify the feature.
4. Close the browser before deleting only the directory created for that launch. Attempt cleanup even when launch or the check fails. Do not delete or modify shared profiles or application-data directories.
5. If this isolated attempt still fails, report the startup blocker and logs. Do not keep changing profile paths or retrying other engines to hide missing Firefox coverage.

For an existing Playwright script, adapt its Firefox launch as follows. Resolve Playwright from the target repository's installed dependencies. The `try` block owns the browser until its check completes.

```javascript
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { firefox } = require('@playwright/test');

async function checkFirefox() {
  const appData = await mkdtemp(join(tmpdir(), 'agent-firefox-app-data-'));
  let browser;
  try {
    browser = await firefox.launch({
      headless: true,
      env: { ...process.env, MOZ_APP_DATA: appData },
    });
    // Run the requested check using this browser.
  } finally {
    try {
      await browser?.close();
    } finally {
      await rm(appData, { recursive: true, force: true });
    }
  }
}
```

When a test runner owns browser launches, use its supported launch-environment mechanism for the same isolation and lifetime. Do not change checked-in project configuration solely to accommodate this personal host issue.
