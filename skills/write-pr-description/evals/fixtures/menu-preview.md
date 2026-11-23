# Menu positioning

Draft this PR description locally. The PR targets `release/2.x`. The default branch, `trunk`, has a different menu design. The base build is `ba5e201` and the latest PR build is `face203`. An older preview of `face202` predates the keyboard fix.

On both current builds, the same Menu story opens with the same items and theme. Inspected PNGs are available under `/tmp/menu-preview/`. Each row below has two files named `<scenario>-<revision>.png` using the base and latest PR revisions.

| Scenario | Before | After |
| --- | --- | --- |
| narrow-pointer | Right half of menu clipped | All actions visible |
| narrow-keyboard | Focused last action below viewport | Focused last action visible |
| wide-pointer | Right edge clipped near window corner | Menu fits inside window |
| wide-keyboard | Focus ring clipped near window corner | Entire focus ring visible |

The PR also adds a compact menu layout. Its inspected screenshot is `compact-face203.png`. The base has no compact layout. The repository template includes Summary, Testing Instructions, and Visual Preview.
