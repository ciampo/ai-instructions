# Sort refactor

The user authorized a local refactor of `sortRows` with the same public behavior.
During implementation the developer drafted a temporary comparison of the old
and new sort functions on rows with ranks `[2, 1, 1]`. It still needs to run.
The old function is due for removal when the refactor is complete.

The new implementation calls `utils/stableSortBy` from the same package and
supplies `row => row.rank`. The utility's regression test sorts items with keys
2, 1, and 1 and checks that the two items with equal keys keep their input order.

The repository requires a public entry point test. It calls `sortRows` with
row A at rank 2 and row B at rank 1 and expects B, A. Sorting by name or
leaving the input unchanged would fail this assertion. Both suites use the
supported production runtime.
