---
name: record-browser-video
description: Create a video file of browser UI for demos, bug reproductions, or PR evidence. Use only when video output is requested. Do not load for still screenshots, Chrome DevTools Recorder action-script exports, or performance traces.
---

# Record browser video

Record the requested interaction. Honor the user's browser and tool choice. For still images, use `take-screenshots`.

## Choose a recording route

- Inspect exposed recording tools and their installed schemas first. A name such as `screencast_start` does not establish its backend, audio support, cursor visibility, or capture area.
- Prefer Chrome's native `Page.startScreenRecording` when the installed browser and available client support it. Use an exposed native recorder, an existing `chrome-capture` installation, or an available Chrome DevTools Protocol session. Read [native Chrome recording](references/native-chrome-recording.md) for version checks, options, and examples.
- If native recording is unavailable, use an exposed recorder or existing repository Playwright/Puppeteer video tooling. An exposed tool with an unknown backend remains usable for its documented capabilities; report the uncertainty instead of claiming native recording. Do not install tools or change configuration just to capture. Report a blocker if no available route can meet the request.
- Reuse a matching browser session and running server after verifying the URL and source checkout. Before launching a local browser on this user's macOS host, load `repository-maintenance` and read its `references/local-browser-execution.md`.
- Page capture may omit browser controls and native dialogs. Verify the required capture area before recording; use an available window or desktop recorder when those are part of the requested evidence.

## Record and verify

1. Identify the interaction, viewport, output path, and any audio or cursor requirements. For an ordinary UI demo, start with a readable viewport, a 60fps target, and audio off. Honor explicit settings and avoid unnecessary scaling.
2. Complete login, navigation, and setup before recording unless they are the subject. Wait for the relevant UI, fonts, and images. Start immediately before the interaction, perform it through supported browser actions, and stop after the result is visible.
3. Stop and finalize recording even when an interaction fails. Save outside the source tree unless a checked-in video was requested. Keep the recording session alive until its API has finished writing the file.
4. Play the saved video when supported. Check the beginning, interaction, and ending for the correct state, readable framing, and requested cursor/audio. If playback is unavailable, inspect extracted frames and available media metadata, and state which motion or audio checks remain unverified. A saved file alone does not prove a successful demo.
5. Treat requested frame rate and encoded frame-rate metadata as targets, not proof of distinct captured frames. Verify actual motion before claiming smooth capture or high-frame-rate performance. Do not edit application markup or styles to improve evidence; disclose any requested cursor or click overlays.

## Deliver

- Return the saved video with a brief description of its source revision or checkout, route, viewport, interaction, and any material verification limit. Use the client's supported video preview or local-file link.
- For before/after recordings, verify both revisions and match viewport, scale, theme, data, and interaction. Preserve unrelated work and report a missing baseline.
- Uploads and PR writes require existing authorization. For authorized attachments, load `repository-maintenance` and follow its GitHub attachment guidance. Recording an interaction does not establish screen-reader support or passing tests.
