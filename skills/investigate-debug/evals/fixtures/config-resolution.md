# Configuration-resolution failure

The checked-in `config/default.json` contains:

```json
{ "endpoint": "https://api.example.test/v2" }
```

The failing command prints `endpoint=https://api.example.test/v1` immediately before this stack:

```text
Unsupported API version: v1
    at loadSchema (src/schema-loader.js:48:9)
    at runImport (src/import-command.js:22:18)
```

`src/import-command.js` reads `IMPORT_ENDPOINT` before loading `config/default.json`. The supplied environment snapshot contains `IMPORT_ENDPOINT=https://api.example.test/v1`. Other commands do not read that variable and continue to use v2.

The user asked for diagnosis only. Do not edit files, clear state, or change the checkout.
