---
name: take-screenshots
description: Capture browser or Storybook screenshots for PR evidence and visual comparisons. Prefer available Chrome DevTools MCP tools, use Storybook MCP for story discovery, and fall back to structured browser automation. Use when screenshots are requested or needed for a visual preview, not for interpreting an attached image or general UI testing.
---

# Take screenshots

Produce readable images of the requested UI state with enough context to identify what they show. Follow an explicit browser or tool choice from the user.

## Choose the shortest supported route

- Discover available tools once. Read their exposed schemas before calling them; server names and parameters vary by installation. A configured server is usable only when its tools are exposed in the current session.
- Prefer Chrome DevTools MCP for browser capture when available. Use Storybook MCP to find relevant stories or their URLs when discovery is needed. A Storybook preview or link is not a saved screenshot.
- If the URL is already known, open it directly. Skip Storybook discovery and documentation queries that do not help reproduce the requested state.
- If Chrome tools are unavailable, use an available structured browser API or the repository's existing Playwright setup. Computer-use tools can expose structured browser APIs too. Use desktop interaction when browser automation cannot reach the required UI, such as browser chrome or an OS dialog.
- Reuse the correct tab and running server after checking the URL and source checkout. Start the repository's documented dev server only when needed. Do not capture a hosted or stale build as evidence of local changes.
- Missing MCP tools do not require installing servers, adding Storybook addons, changing browser profiles, or editing global configuration. Use a working fallback. If none can capture the requested state, report the specific blocker.

## Prepare and capture

1. Identify the requested component or app screen, state, viewport, theme, and output location. Use scoped defaults for unspecified details. For Storybook, prefer the standalone canvas URL when available so navigation and addon panels do not consume the image. Keep app context when the behavior depends on integration.
2. Set the viewport before reproducing the state. Wait for the relevant UI, fonts, and images to finish rendering, using readiness conditions instead of arbitrary sleeps. Complete story interactions before capture. Keep animations consistent when motion is not the subject.
3. Use semantic browser interactions or current snapshot identifiers to reproduce focus, hover, expanded menus, or other requested states. Take a fresh snapshot when needed to resolve a target after the DOM changes. Do not change application markup or CSS to make the screenshot look correct.
4. Choose the smallest capture that preserves the evidence. Element captures work for isolated components, but can crop popovers rendered outside the element. Use a viewport capture for menus, dialogs, clipping, focus, or layout context. Use full-page capture when content beyond the viewport matters. Check that text remains readable.
5. Save directly to an absolute path when supported. Prefer PNG for UI text. With Chrome DevTools MCP, `take_screenshot` accepts `filePath`, `uid` for an element, or `fullPage` for the document. Do not combine `uid` and `fullPage`. Follow the installed schema for page selection and other parameters.
6. Inspect each saved image with the available image viewer before delivery. Recapture only when inspection exposes a missing state, wrong build, clipping, or unreadable content. Keep temporary captures out of the source tree unless the user requested checked-in assets.

Use DOM snapshots for navigation and target lookup instead of taking a screenshot after every interaction. Reuse the browser session across requested states. Collect only the views needed to demonstrate the change; avoid a viewport or theme matrix unless the task calls for it.

## Comparisons and delivery

- For before/after evidence, verify the baseline and changed revisions separately. Use the same viewport, scale, theme, data, scroll position, and interaction state. Preserve unrelated work when preparing the baseline. Label an unavailable baseline as unavailable instead of fabricating it from the changed UI.
- Name files by subject and state, such as `menu-expanded-after-320px.png`. Report the source revision or checkout, story ID or app route, viewport, and state needed to reproduce each image. State whether evidence comes from an isolated story or the integrated app.
- Show the resulting images or link the saved artifacts using the host's supported format. In Codex, local image embeds need absolute paths. Keep captions brief. Screenshot capture does not authorize uploading images, posting GitHub comments, or editing a PR description; use the authority already granted for those actions.
- Screenshots document appearance. Do not present them as proof of keyboard behavior, screen-reader support, or passing tests without separate evidence. Do not claim a measured speed improvement from the chosen tool without timing evidence.

## Tool references

Use the installed schemas first. Consult the official references only when a capability or parameter remains unclear:

- [Chrome DevTools MCP tool reference](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md)
- [Storybook MCP overview](https://storybook.js.org/docs/11/ai/mcp/overview/), matching the project's installed Storybook version
