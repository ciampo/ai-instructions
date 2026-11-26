# New feedback on a function that earlier feedback already changed twice

This is a synthetic, complete immutable PR snapshot of my own PR. Use only this fixture; do not use the network. The base, head, discussion, and CI state remain unchanged at the final freshness check. Local fixes are authorized. Commits and pushes are not. Draft the replies in chat only.

- PR: <https://github.com/example/calendar/pull/205>, authored by the user
- Title: Show the event date in the agenda row
- Repository: `example/calendar`
- Base: `7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a`
- Head: `8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b`
- Merge base: same as base
- CI: all configured checks passed.
- Changed files: `src/format-date.js`, `src/agenda-row.js`, and `test/format-date.test.js`.

## Full head source, src/format-date.js, lines 1-13

```js
const MONTHS = {
  en: [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
  fr: [ 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.' ],
};

export function formatDate( date, locale ) {
  const language = locale.split( '-' )[ 0 ];
  const months = MONTHS[ language ] ?? MONTHS.en;
  if ( language === 'fr' ) {
    return date.getDate() + ' ' + months[ date.getMonth() ];
  }
  return months[ date.getMonth() ] + ' ' + date.getDate();
}
```

## Complete discussion, including replies and resolution state

- <https://github.com/example/calendar/pull/205#discussion_r501>, resolved, `src/format-date.js`, first review: "The month is off by one." Fixed in commit `c1c1c1c`: the month index no longer adds 1. The head source confirms the fix.
- <https://github.com/example/calendar/pull/205#discussion_r502>, resolved, `src/format-date.js`, second review: "French users see English month names, and the day should come first." Fixed in commit `d2d2d2d`: the `fr` table and branch. The head source confirms the fix.
- <https://github.com/example/calendar/pull/205#discussion_r503>, open, `src/format-date.js:8`, third review: "German and Spanish users still get English month names. We support `de` and `es`."
- <https://github.com/example/calendar/pull/205#discussion_r504>, open, `src/format-date.js:12`, third review: "`en-GB` should show the day first, like `12 Mar`."
- There are no other comments, reviews, or decisions.

## Contract, consumers, and siblings

- `formatDate( date, locale )` is internal. `AgendaRow` is its only caller and passes the user's locale, such as `en-US`, `en-GB`, `fr-FR`, `de-DE`, or `es-ES`. The product supports those five locales.
- The required output is the abbreviated month and the day of the month in the order that the locale uses.
- `src/format-time.js`, in the same directory, formats times with `new Intl.DateTimeFormat( locale, { hour: 'numeric', minute: '2-digit' } )`. All supported runtimes provide `Intl.DateTimeFormat` with the five supported locales.
- `test/format-date.test.js` asserts `Mar 12` for `en-US` and `12 mars` for `fr-FR`.
