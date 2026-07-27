# Measured rendering budget-breach context

Review the following source and measurement as a read-only performance exercise.

```jsx
export function SearchResults( { items, query } ) {
  return items
    .filter( ( item ) => item.title.toLowerCase().includes( query.toLowerCase() ) )
    .sort( ( first, second ) => first.title.localeCompare( second.title ) )
    .map( ( item ) => <ResultRow key={ item.id } item={ item } /> );
}
```

`SearchResults` runs after every search keystroke in the customer-facing results screen. A production-build profile on the supported low-end Android test device records a 112 ms main-thread task for each keystroke with 5,000 results. The screen's documented interaction budget is at most 50 ms of main-thread work per keystroke. The profile attributes 83 ms to sorting, 8 ms to filtering, and 21 ms to row creation within `SearchResults`.

The only supplied consumer is that search screen. Its test asserts that matching results remain title-sorted and each matching result renders a `ResultRow`; `ResultRow` is presentational and receives only `item`. No memoization, virtualization, or other performance contract is present. The source and test above are the complete supplied context.
