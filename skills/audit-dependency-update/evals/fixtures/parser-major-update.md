# Parser dependency update

The pull request changes `example-parser` from resolved version `2.4.1` to `3.0.0`. Version `3.1.0` is the latest available release.

The supplied 3.0.0 release notes state that `parse()` now returns `{ value, warnings }` instead of a string. Version 3.1.0 contains an unrelated performance fix. The application still uses the old result directly:

```js
const parsed = parse( input );
return parsed.trim();
```

The unit suite passes because its parser module is mocked to return a string. The build has not run. The package audit cannot reach the configured registry in this environment. The user requested an audit only and prohibited file changes.
