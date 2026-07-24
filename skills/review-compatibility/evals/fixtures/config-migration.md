# Configuration migration context

Review this version-controlled migration as a read-only compatibility exercise.

Version 2 accepts `theme` and writes that key. Version 3 renames it to `colorScheme`.

```js
export function readSettings( input ) {
  return { colorScheme: input.colorScheme ?? 'system' };
}

export function writeSettings( settings ) {
  return JSON.stringify( { colorScheme: settings.colorScheme } );
}
```

Existing version-2 settings are persisted as `{ "theme": "dark" }`. The supported upgrade policy includes existing persisted settings, but no rollback policy or migration test is supplied.
