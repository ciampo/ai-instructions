# Measured rendering cost without a performance contract

Review the following source and measurement as a read-only performance exercise.

```jsx
export function SearchResults( { items, query } ) {
  return items
    .filter( ( item ) => item.title.toLowerCase().includes( query.toLowerCase() ) )
    .sort( ( first, second ) => first.title.localeCompare( second.title ) )
    .map( ( item ) => <ResultRow key={ item.id } item={ item } /> );
}
```

`SearchResults` runs after every search keystroke with 5,000 results. A production-build profile on a supported low-end Android test device attributes 112 ms of main-thread work per keystroke to `SearchResults`. No interaction budget, comparable baseline, user-impact measurement, or documented performance contract is available. No `ResultRow` source, consumer map, or relevant test is provided; this is the complete supplied context.
