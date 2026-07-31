# Derived product filter fixture

Review this self-contained change as a read-only simplification exercise.

## Required behavior

- Filter the supplied product list synchronously from the current query.
- Matching is case-insensitive and ignores surrounding query whitespace.
- Keep the visible result count in the existing polite live region.
- No public API or supported-browser change is intended.

## Existing shared source

`src/products/filter-products.ts`:

```ts
export function filterProducts(
    products: Array< { id: string; name: string } >,
    query: string
) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return products.filter( ( product ) =>
        product.name.toLocaleLowerCase().includes( normalizedQuery )
    );
}
```

This function is already used by `ProductPicker` and its behavior matches the requirements above.

## Added source

`src/catalog/normalize-product-query.ts`:

```ts
export function normalizeProductQuery( query: string ) {
    return query.trim().toLocaleLowerCase();
}
```

`src/catalog/FilteredCatalog.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { normalizeProductQuery } from './normalize-product-query';

export function FilteredCatalog( { products, query } ) {
    const [ visibleProducts, setVisibleProducts ] = useState( products );

    useEffect( () => {
        const normalizedQuery = normalizeProductQuery( query );
        setVisibleProducts(
            products.filter( ( product ) =>
                product.name.toLocaleLowerCase().includes( normalizedQuery )
            )
        );
    }, [ products, query ] );

    return (
        <>
            <p aria-live="polite">{ visibleProducts.length } products</p>
            <ul>
                { visibleProducts.map( ( product ) => (
                    <li key={ product.id }>{ product.name }</li>
                ) ) }
            </ul>
        </>
    );
}
```

## Existing verification

The component tests assert that the first committed render contains only matching products for the current query, matching remains case-insensitive, query whitespace is ignored, and the polite live region reports the visible count. No profile, bundle budget, or need for a generalized filtering hook was supplied.
