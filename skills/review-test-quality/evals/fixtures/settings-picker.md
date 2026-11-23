# Settings picker migration

The settings screen now uses the installed shared `Picker` with its default
keyboard handling. The screen supplies the options and maps the selected label
to a stored preference. Saving closes the editor, unmounts the picker, and
returns focus to the Edit button.

| Suite | Setup and assertion |
| --- | --- |
| Installed picker, browser | Open the picker, press ArrowDown, and assert the second option is active. |
| Settings, new browser test | Open the picker, press ArrowDown, and assert the second option is active. |
| Settings, existing unit test | Select Compact and assert the save callback ran. It would also pass if the screen saved `comfortable`. |
| Settings, existing browser regression | Select Compact, wait for the editor to unmount, and assert Edit has focus. |
| Temporary settings test | Mock the picker and call the save callback directly. The test has no DOM. |
