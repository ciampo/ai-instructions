# Native focus ordering

The user asks for an assessment of alternative fixes, with no source changes. A dialog reportedly loses focus in Browser S version 18 on OS M version 15. It does not reproduce in Browser C. The report contains no event trace or recording from Browser S.

The code schedules initial dialog focus in a microtask. The user suggests replacing that with a timer. The documented contract requires focus to enter the dialog after it opens, without stealing focus back after the user moves it elsewhere.

The available automation can drive Browser C only. Browser S exposes a read-only window snapshot. Its remote automation is unavailable under the current tool policy. The user has not authorized changing application settings. There is no captured observation establishing whether the native focus event occurs before or after the microtask in Browser S.

A disposable reproduction can record open events, microtask execution, native focus events, and the active element. It can also test a user moving focus before the timer runs. That reproduction has not run in Browser S. Source inspection can establish that an unconditional timer could override later user focus, but cannot establish the reported native event ordering.
