# File count context

Review this version-controlled UI as a read-only internationalization exercise.

```jsx
export function UploadStatus( { count } ) {
  return <p>{ count + ' file' + ( count === 1 ? '' : 's' ) + ' uploaded' }</p>;
}
```

The project uses count-aware `t( key, { count } )` for translated messages; its catalog resolves the locale's CLDR plural categories from that count. It supports Arabic and German, but no rendered screenshots or RTL test are supplied.
