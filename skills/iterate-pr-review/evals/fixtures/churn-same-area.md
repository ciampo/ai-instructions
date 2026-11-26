# Third finding in an area that two rounds already fixed

This is a synthetic, complete immutable context. Use only this fixture; do not use the network. The base, candidate, discussion, and CI state remain unchanged at the final freshness check.

- Pull request: <https://github.com/example/ui/pull/71>, authored by the user
- Title: Trap focus in Dialog
- Description: "Fixes #64. Keyboard focus stays inside an open `Dialog`."
- Base revision: `1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a`
- Current head revision: `2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b`
- Completed change rounds: 2 of 5.
- Authority: local fixes, commits, and pushes to the PR branch are authorized.
- Existing PR feedback: none.
- CI for the current head: passed.

## Round history

1. Round 1 review of the first candidate. Accepted finding in `trapFocus`, `src/dialog/focus-trap.js`: Tab moved focus to disabled buttons. Fix: the selector now excludes `:disabled`. Verified and committed.
2. Round 2 review of the second candidate. Accepted finding in `trapFocus`: Tab moved focus to elements hidden with `display: none`, which the first fix did not cover. Fix: `isVisible` filter. Verified and committed. This is the current head.
3. Round 3 independent local agent review of the current head: complete. One finding, in `trapFocus`: "When the last focusable element is inside the embedded payment `<iframe>`, Tab does not wrap and focus leaves the dialog. Suggested fix: add a focusable sentinel after the iframe and move focus to the first element when the sentinel receives focus." The finding is confirmed against the source below. The review reported no other finding.

## Current-head source, src/dialog/focus-trap.js

```js
const SELECTOR = 'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])';

function isVisible( element ) {
  return element.offsetParent !== null;
}

export function trapFocus( container, event ) {
  if ( event.key !== 'Tab' ) {
    return;
  }
  const items = [ ...container.querySelectorAll( SELECTOR ) ].filter( isVisible );
  const first = items[ 0 ];
  const last = items[ items.length - 1 ];
  if ( event.shiftKey && document.activeElement === first ) {
    event.preventDefault();
    last.focus();
  } else if ( ! event.shiftKey && document.activeElement === last ) {
    event.preventDefault();
    first.focus();
  }
}
```

## Contract and consumers

- `Dialog` is a public component. It renders `<div role="dialog" aria-modal="true">` and accepts an `as` prop that changes the rendered element. Its documentation says: "Focus stays inside an open dialog."
- `CheckoutDialog`, a supported consumer, embeds a third-party payment `<iframe>` as the last content of the dialog. Script in the page cannot read or list the focusable elements inside that iframe.
- Three consumers pass `as="section"`. Two consumers style the dialog with the selector `div[role="dialog"]`.
- No other focus-trap code exists in the repository.
- All supported browsers implement the native `<dialog>` element. `showModal()` keeps focus inside the dialog, including content in iframes, without script that lists focusable elements. A native `<dialog>` cannot honor the `as` prop, and the `div[role="dialog"]` selectors would stop matching.
- The `inert` attribute is not an option. One supported embedded webview implements `<dialog>` but not `inert`.
