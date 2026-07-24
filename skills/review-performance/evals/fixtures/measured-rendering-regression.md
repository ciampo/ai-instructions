# Measured rendering regression context

Review the following source and measurement as a read-only performance exercise.

```jsx
export function SearchResults( { items, query } ) {
  return items
    .filter( ( item ) => item.title.toLowerCase().includes( query.toLowerCase() ) )
    .sort( ( first, second ) => first.title.localeCompare( second.title ) )
    .map( ( item ) => <ResultRow key={ item.id } item={ item } /> );
}
```

`SearchResults` runs after every search keystroke in the customer-facing results screen. A production build profile on the supported low-end Android test device records a 112 ms main-thread task for each keystroke with 5,000 results. The screen's documented interaction budget is at most 50 ms of main-thread work per keystroke. The profiler attributes the task to `SearchResults`; the repository has no existing memoization or virtualization contract.
