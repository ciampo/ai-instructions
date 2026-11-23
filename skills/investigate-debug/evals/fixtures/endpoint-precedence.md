# Import endpoint precedence

The public command must prefer an explicit endpoint to the configuration
default. A recent edit reversed the arguments to the resolver:

```js
const endpoint = firstDefined(config.endpoint, args.endpoint);
```

The existing command test invokes `import --endpoint custom` with a default
endpoint of `standard`. It captures the requested endpoint through the test
server. CI expected `custom` and received `standard`. The neighboring test
omits the flag and still passes with `standard`.
