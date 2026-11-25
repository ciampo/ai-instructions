# Supplied source

`src/slugify.js`:

```js
export function slugify( text ) {
  return text.trim().toLowerCase().replace( /\s/g, '-' );
}
```

`src/slugify.test.js`:

```js
import { slugify } from './slugify.js';

test( 'lowercases and joins words', () => {
  expect( slugify( 'Hello World' ) ).toBe( 'hello-world' );
} );
```

Reported behavior: `slugify( 'Hello  World' )` (two spaces) returns `hello--world`. The expected result is `hello-world`.
