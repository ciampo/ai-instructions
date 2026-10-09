# Local visual preview

The user requests only a local draft and prohibits GitHub writes. The diff fixes clipped dialog text. Related issue: `Fixes #12`. Use What, Why, How, Testing Instructions, and Visual Preview.
Inspected screenshots are available at `/tmp/dialog-before.png` and `/tmp/dialog-after.png`. Manual verification opens the dialog at 320px and checks that the full message is visible.
Installed `gh` supports `--attach`, the OAuth token grants repository write access, and a browser uploader is available. None of that grants upload authority for this request.
