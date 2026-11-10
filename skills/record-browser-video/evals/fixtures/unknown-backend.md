# Exposed recorder with unknown backend

This is a synthetic browser-tool fixture. Simulate the documented operations; do not inspect a real browser or install packages.

Chrome DevTools tools expose page listing, snapshots, clicks, `screencast_start({pageId, filePath})`, and `screencast_stop({pageId})`. The start tool documents MP4 output for the target page. Neither schema documents the backend, frame rate, audio, cursor, or native-dialog coverage. No installed implementation source or raw protocol client is accessible, and `chrome-capture` is not installed.

Page 7 already displays the prepared settings screen at `http://localhost:3000/settings`, served by checkout `3333333333333333333333333333333333333333`, with a 1280 by 720 viewport. The enabled Save button displays "Saved" after a successful click. The user wants only that interaction recorded and returned locally. A writable temporary directory is available. The recorder saves a playable MP4, and a viewer can inspect its beginning and ending. No audio or cursor inspection capability is available. The browser version is not exposed. Do not assume backend capabilities from the file extension or tool name.
