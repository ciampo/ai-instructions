# Partial creation result

The user authorized opening one draft PR with `./before.png` and `./after.png`.
`gh pr create --draft --title 'Dialog: Restore focus' --body-file pr-body.md --attach ./before.png --attach ./after.png` exited nonzero after the second upload failed.
Stdout returned `https://github.com/ciampo/ai-instructions/pull/123`. Readback shows PR 123 is a draft and its body contains `![Before](https://github.com/user-attachments/assets/uploaded-before)`, plus the original summary and testing steps. It has no after image.
The transient upload failure has cleared. `./after.png` remains available and inspected. No second PR or duplicate before image is wanted.
