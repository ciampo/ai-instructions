# Approach that conflicts with a recorded decision

This is a synthetic, complete immutable PR snapshot. Use only this fixture; do not use the network. The base, head, discussion, and CI state remain unchanged at the final freshness check.

- PR: <https://github.com/example/toolbar/pull/212>
- Title: Fix tooltip flicker between toolbar buttons
- Repository: `example/toolbar`
- Base: `3333333333333333333333333333333333333333`
- Head: `4444444444444444444444444444444444444444`
- Merge base: same as base
- Target audience: maintainers reviewing a contributor's PR
- History: one commit, `Add hideDelay to ToolbarButton`
- Description: "Fixes #198. Adds a `hideDelay` prop to `ToolbarButton`, so a tooltip stays open for 300 ms after the pointer leaves. The next tooltip no longer flickers."
- CI: all configured checks passed. No test changed.
- Changed files: `src/toolbar-button.js` only. The full diff and source follow.
- Existing review state: no comments or reviews on the PR.

## Linked issue #198, complete

- Report: "Move the pointer along the toolbar. Each tooltip closes, and the next one opens only after the 700 ms open delay. The tooltips flicker."
- Maintainer comment, the only decision on the issue: "`TooltipGroup` already handles this. Inside a group, the next tooltip opens with no delay while another one is open. `MenuBar` uses it. `Toolbar` never wraps its buttons in a group, and that is the bug. Please fix it by wrapping the buttons in `Toolbar`. Do not add timers to single buttons. We removed those in #150 because a tooltip stayed open after keyboard focus moved to the next button."
- No later comment changes this decision. The PR description does not mention it.

## Diff

```diff
-export function ToolbarButton( { label, onClick } ) {
+export function ToolbarButton( { label, onClick, hideDelay = 300 } ) {
+  const [ open, setOpen ] = useState( false );
+  const timer = useRef();
+  const show = () => setOpen( true );
+  const hide = () => {
+    timer.current = setTimeout( () => setOpen( false ), hideDelay );
+  };
   return (
-    <Tooltip text={ label }>
-      <button onClick={ onClick }>{ label }</button>
+    <Tooltip text={ label } open={ open }>
+      <button onClick={ onClick } onMouseEnter={ show } onMouseLeave={ hide }>
+        { label }
+      </button>
     </Tooltip>
   );
 }
```

## Full head source, src/toolbar-button.js, lines 1-17

```js
import { useRef, useState } from 'react';
import { Tooltip } from './tooltip';

export function ToolbarButton( { label, onClick, hideDelay = 300 } ) {
  const [ open, setOpen ] = useState( false );
  const timer = useRef();
  const show = () => setOpen( true );
  const hide = () => {
    timer.current = setTimeout( () => setOpen( false ), hideDelay );
  };
  return (
    <Tooltip text={ label } open={ open }>
      <button onClick={ onClick } onMouseEnter={ show } onMouseLeave={ hide }>
        { label }
      </button>
    </Tooltip>
  );
}
```

## Related source and consumers

- `src/tooltip.js`: an uncontrolled `Tooltip` opens on pointer hover and on keyboard focus, and closes on pointer leave, blur, and Escape. A controlled `Tooltip` shows only what its `open` prop says.
- `src/tooltip-group.js`: `TooltipGroup` shares one open state between its tooltips. While one tooltip is open, the next one opens with no delay. It has tests for pointer and keyboard movement.
- `src/menu-bar.js`: wraps its items in `TooltipGroup`.
- `src/toolbar.js`: renders its `ToolbarButton` children directly, with no `TooltipGroup`.
- `ToolbarButton` is a public export. Twelve internal call sites use it.
