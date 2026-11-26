# Authored PR whose approach needs rethinking

This is a synthetic, complete immutable PR snapshot of my own draft PR. Use only this fixture; do not use the network. The base, head, discussion, and CI state remain unchanged at the final freshness check. Local fixes are authorized for valid findings; commits and pushes are not.

- PR: <https://github.com/example/uploader/pull/58>
- Title: Retry failed uploads
- Repository: `example/uploader`
- Base: `9999999999999999999999999999999999999999`
- Head: `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
- Merge base: same as base
- History: one commit, `Retry failed uploads in UploadButton`
- Description: "Fixes #51. `UploadButton` now retries a failed upload up to three times."
- CI: all configured checks passed. No test changed.
- Changed files: `src/upload-button.js` only. The full diff and source follow.
- Existing review state: no comments or reviews on the PR.

## Linked issue #51, complete

- Report: "Uploads fail on a weak connection, and the user must select the file again. Uploads should retry like our other requests do."
- No other comment.

## Diff

```diff
 async function upload( file ) {
-  await requestQueue.add( { url: '/upload', body: file } );
+  for ( let attempt = 0; attempt < 3; attempt++ ) {
+    try {
+      await requestQueue.add( { url: '/upload', body: file } );
+      return;
+    } catch ( error ) {
+      await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
+    }
+  }
 }
```

## Full head source, src/upload-button.js, lines 1-17

```js
import { requestQueue } from './request-queue';

async function upload( file ) {
  for ( let attempt = 0; attempt < 3; attempt++ ) {
    try {
      await requestQueue.add( { url: '/upload', body: file } );
      return;
    } catch ( error ) {
      await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
    }
  }
}

export function UploadButton() {
  return <input type="file" onChange={ ( event ) => upload( event.target.files[ 0 ] ) } />;
}
```

## Related source and consumers

- `src/request-queue.js`: `requestQueue.add( request )` accepts `retry: { attempts, backoff }`. With that option, the queue retries network errors and HTTP 5xx responses with exponential backoff, does not retry HTTP 4xx responses, stops when the request is cancelled, and rejects with the last error. It has tests for each case.
- `src/save-draft.js` and `src/sync-settings.js` call `requestQueue.add` with `retry: { attempts: 3, backoff: 'exponential' }`. No other module implements its own retry loop.
- The server answers HTTP 413 for a file that is too large. A retry cannot succeed for that response.
- Before this PR, a failed upload rejected, and the page-level error boundary showed "Upload failed".
