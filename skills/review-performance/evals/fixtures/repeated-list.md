# Repeated-list performance context

Review the following source as a read-only performance exercise.

```jsx
export function SearchResults( { items, query } ) {
  return items
    .filter( ( item ) => item.title.toLowerCase().includes( query.toLowerCase() ) )
    .sort( ( first, second ) => first.title.localeCompare( second.title ) )
    .map( ( item ) => <ResultRow key={ item.id } item={ item } /> );
}
```

`SearchResults` renders after every keystroke. No item count, profiler result, memoization contract, or `ResultRow` implementation is provided.
