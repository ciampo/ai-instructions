---
name: take-screenshots
description: Capture browser or Storybook screenshots for PR evidence, visual previews, and before/after comparisons. Use for screenshot capture, not interpreting attached images or general UI testing.
---

# Take screenshots

Capture the requested UI state. Honor the user's browser or tool choice.

## Choose tools

- Prefer exposed Chrome DevTools MCP tools. Read installed schemas; configuration alone does not make tools available.
- For unknown Storybook URLs, use available Storybook MCP discovery. Open known URLs directly. Preview links are not saved images.
- Otherwise use an available structured browser API, including one exposed by computer use, or existing repository Playwright tooling. Use desktop interaction for UI those tools cannot reach. Report a blocker if no route works; do not install tools or change configuration just to capture.
- Reuse a matching tab and server after verifying the URL and source checkout. Start the documented dev server only if needed. A stale or hosted build does not prove local changes.

## Capture

1. Identify the screen or story, state, viewport, theme, and output location. Default unspecified details. Prefer Storybook's standalone canvas; use the integrated app when integration matters.
2. Set the viewport, then reproduce the state with semantic interactions or current snapshot identifiers. Refresh identifiers after DOM changes. Wait for UI, fonts, images, and story interactions to finish instead of sleeping. Keep animations consistent unless motion is the subject. Do not alter markup or styles to improve the evidence.
3. Capture the smallest area that preserves readable text and relevant context. Element captures can omit portaled popovers; use viewport captures for menus, dialogs, focus, or clipping. Use full-page capture when offscreen content matters.
4. Prefer PNG and save directly to an absolute path when supported. Chrome's `take_screenshot` uses `filePath`, optional element `uid`, or `fullPage`; do not combine `uid` with `fullPage`. Follow the exposed schema.
5. Inspect every saved image before delivery. Recapture if the build, state, framing, or readability is wrong. Keep temporary images outside the source tree unless checked-in assets were requested.

Use DOM snapshots for navigation, not screenshots after every interaction. Reuse the session and capture only requested or necessary views.

## Compare and deliver

- Verify before/after revisions separately. Match viewport, scale, theme, data, scroll position, and interaction state. Preserve unrelated work. Report an unavailable baseline instead of fabricating one.
- Name images by subject and state. Show or link them with brief captions identifying source revision or checkout, story ID or app route, viewport, and state. Distinguish isolated stories from integrated-app evidence. Codex local image embeds require absolute paths.
- Uploads and PR writes require existing authorization. Images prove appearance, not keyboard behavior, screen-reader support, or passing tests. Tool speed claims require timing evidence.

If schemas leave a capability unclear, consult the [Chrome tool reference](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md) or [Storybook MCP docs](https://storybook.js.org/docs/11/ai/mcp/overview/) matching the installed version.
