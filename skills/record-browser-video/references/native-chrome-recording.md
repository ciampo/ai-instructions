# Native Chrome recording

Read this when selecting or using Chrome's native recorder. Check installed browser/client support before adapting these examples.

## Availability and scope

[`chrome-capture`](https://github.com/paulirish/chrome-capture) documents native recording in Chrome 153+. The protocol marks [`Page.startScreenRecording`](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-startScreenRecording) and `Page.stopScreenRecording` experimental. Verify the installed version and exposed protocol or client support; a current online schema does not prove the connected browser supports a command.

Chrome encodes AV1 video directly into MP4, with optional tab audio. This avoids the older `Page.startScreencast` path that transfers individual frames for external encoding. Do not assume a tool named "screencast" uses either path without evidence. Playback support must also be checked in the intended viewer.

- `captureArea: 'target'` records the page and is the default. It does not promise browser controls or native dialogs.
- `captureArea: 'browserWindow'` requires a trusted client and an embedder that supports it. Confirm support before relying on it for browser controls or docked DevTools; it is not whole-desktop capture.
- `audio` requests tab audio, not microphone narration or all system audio.
- `maxWidth` and `maxHeight` are size limits. Inspect the actual output dimensions instead of assuming they set the viewport.
- `frameRate` is a maximum. The project reports 120fps on suitable hardware, including visible Chrome on a 120Hz ProMotion Mac. Its macOS headless results reach 60 distinct frames per second. These are reported results, not guarantees for another host.
- On GPU-accelerated macOS, the project warns that `--disable-frame-rate-limit` and `--disable-gpu-vsync` can reduce capture performance. Keep normal synchronization rather than adding those flags to chase a frame-rate target.

## Existing Playwright or Puppeteer session

When `chrome-capture` is already available, its `startRecording()` accepts a Playwright page, Puppeteer page, or compatible protocol session. Reuse the prepared page and resolve the package from the environment where it is installed. Do not run `npx chrome-capture` merely to discover whether it works; that command may download a package.

```javascript
import { startRecording } from 'chrome-capture';

// `page` is the existing page, after setup is complete.
const recording = await startRecording(page, {
  outputPath: '/absolute/writable/path/demo.mp4',
  maxWidth: 1920,
  maxHeight: 1080,
  frameRate: 60,
  captureArea: 'target',
  audio: false,
});

try {
  // Perform the requested interaction and wait for its visible result.
} finally {
  await recording.stop();
}
```

The [wrapper implementation](https://github.com/paulirish/chrome-capture/blob/main/src/index.ts) stops recording, reads the resulting protocol stream, closes its handle, and saves the MP4. With raw protocol access, perform the same lifecycle: start, interact, stop, read the returned handle with `IO.read` until `eof`, decode chunks according to `base64Encoded`, and close it with `IO.close` in cleanup. Do not treat the returned stream handle as a saved file.

## Cursor and fallback

A page recording does not establish that the pointer or click location will be visible. Use an existing automation client's supported cursor/action overlay when needed, verify it appears in the result, and disclose it. Do not inject arbitrary DOM decorations into visual evidence.

If the installed browser lacks the native command, use existing video tooling instead. Playwright's [`recordVideo`](https://playwright.dev/docs/videos) must be configured when creating the context, so it may require a new context and repeated setup. Close that context to finish saving. Keep an existing user's session intact, and label the actual route and output format.
