# File count context

Review this version-controlled UI as a read-only internationalization exercise.

```jsx
export function UploadStatus( { count } ) {
  return <p>{ count + ' file' + ( count === 1 ? '' : 's' ) + ' uploaded' }</p>;
}
```

The project uses `t( key, values )` and `plural( singularKey, pluralKey, count, values )` for translated messages. It supports Arabic and German, but no rendered screenshots or RTL test are supplied.
