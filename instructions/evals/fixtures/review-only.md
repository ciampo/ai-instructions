# Supplied source

`src/price.js`:

```js
export function applyDiscount( price, percent ) {
  if ( percent > 100 ) {
    return 0;
  }
  return price - price * percent;
}
```

Callers pass `percent` as a whole number such as `20` for a 20% discount.
