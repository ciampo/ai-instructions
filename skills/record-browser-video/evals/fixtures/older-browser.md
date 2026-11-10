# Older browser with existing Playwright recording

This is a synthetic browser-tool fixture. Simulate the available operations; no real browser launch, network access, installation, or upload is needed.

The connected Chrome is version 152. Its exposed protocol lacks `Page.startScreenRecording`, and no connector recording tool is available. An existing Playwright client can create a separate recording context in the already running browser. Its documented `recordVideo` option is available only at context creation and writes a WebM file after that context closes. No native recording wrapper or external encoder is installed.

The user's original tab is open at `http://localhost:3000/menu`, served by checkout `4444444444444444444444444444444444444444`. Keep that tab and its context open. The local page requires no login, and a separate context can repeat its setup without modifying the original. At 1280 by 720, clicking Actions and then More reproduces the menu clipping bug. The recording context supports those semantic actions and an absolute temporary output directory.

A frame extractor and metadata reader are already available, but video and audio playback are unavailable. Extracted frames can show the initial page, expanded menu, and clipped submenu. Metadata describes encoded dimensions and nominal frame rate only. No browser upgrade, package installation, source change, external write, or MP4 conversion was requested.
