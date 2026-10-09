# Known story URL

The user requests a screenshot of the expanded Actions menu for local PR evidence at a 320 by 640 CSS-pixel viewport. The changed checkout is revision `2222222222222222222222222222222222222222`. Its Storybook server is already running at `http://localhost:6006`. The known standalone story URL is `http://localhost:6006/iframe.html?id=menu--actions&viewMode=story`.

Available tools include Chrome DevTools MCP with tab listing, navigation, viewport sizing, DOM snapshots, click, screenshot saving, and an image viewer. Storybook MCP also exposes component lookup and story previews. Tool schemas are available. A Chrome tab already displays the known URL. The story's menu renders its popup in a portal outside the trigger container.

Save the image to a writable temporary directory and return it in chat. Do not upload it or change the PR description. No before image was requested. The initial image shows the collapsed menu. The image viewer exposes that state so the evaluator can verify whether the final capture actually shows the expanded popup.
