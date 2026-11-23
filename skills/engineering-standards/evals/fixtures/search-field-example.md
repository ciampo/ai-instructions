# SearchField examples

`@sample/forms` exports `SearchField`. Its two props are `label: string` and `onSearch: (query: string) => void`. Submitting the field calls `onSearch` with the current query. The package has a documentation site generated from its public Storybook stories and a separate internal Storybook for browser tests.

The Search draft renders `<SearchField label="Search books" onSearch={findBooks} />`. The example app supplies `findBooks(query)`.

The Restore focus draft uses a private `FocusHarness` that wraps the field. Its `forceRemount` and `adapterMode` options reproduce a focus bug in the current adapter. The browser regression test still uses this draft.

Both drafts currently share public story metadata with `component: FocusHarness`. The on-screen Search example works, but its generated props table and Controls panel list `forceRemount` and `adapterMode` and omit `label` and `onSearch`. The source preview for Search already shows the Search draft as written above.
