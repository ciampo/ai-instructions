# Prepared native recording session

This is a synthetic browser-tool fixture. Simulate the tool calls against the supplied state; do not contact a live app, install packages, or upload artifacts.

The user wants a video of dragging the first card below the second card, with a visible cursor and no audio. The existing Chrome 153 page is at `http://localhost:6006/iframe.html?id=cards--sortable&viewMode=story`. Its local server serves checkout `2222222222222222222222222222222222222222`. The viewport is 1440 by 900. Login, font loading, and story setup are complete. There are two cards, "First card" and "Second card", in that order.

The existing automation client exposes page URL, viewport, semantic drag actions, and a supported cursor/click overlay. Its native recording wrapper is already installed and accepts the `startRecording(page, options)` interface from `chrome-capture`. The installed protocol supports `Page.startScreenRecording` and `Page.stopScreenRecording`. A successful stop saves the MP4 at the requested absolute writable path. The client also exposes Playwright context creation with the older `recordVideo` option, but no new context is needed to record this page.

Video playback and media metadata inspection are available. The initial frame shows the original order; the ending frame shows the resulting order only if the drag was performed. The cursor is visible only if the client overlay was enabled. Metadata reports the requested frame-rate ceiling without proving distinct captured frames. A file may exist even if no drag occurred. No comparison, installation, browser launch, source edit, or external write was requested.
