# Before and after comparison

The user requests before and after screenshots of a wrapping regression in the integrated app at a 320 by 640 CSS-pixel viewport. Chrome DevTools MCP and an image viewer are available. Both baseline revision `1111111111111111111111111111111111111111` and changed revision `2222222222222222222222222222222222222222` can run in separate disposable checkouts.

The baseline uses light mode with the menu expanded and the page scrolled to the trigger. The initial changed preview uses dark mode, has the menu collapsed, and is at the top of the page. A hosted Storybook preview displays a similar component but was built from an older revision.

The task checkout contains unrelated uncommitted work. The user authorized temporary baseline setup and local screenshots, but no cleanup of unrelated files, image upload, comments, or PR metadata changes. The saved images must be inspected and returned with enough context to reproduce the comparison.
