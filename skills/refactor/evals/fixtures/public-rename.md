# Public factory rename

The package exports `createClient` from `src/index.ts`. It appears in:

- three implementation files;
- six unit tests;
- two examples;
- the API reference;
- one migration guide;
- two in-repository packages that import the public entry point.

The package is published and may have external consumers. The request does not say whether `createClient` must remain as a deprecated alias or whether this is an authorized breaking release.

The current lint, type-check, unit-test, and package-build baseline passes. The user requested local refactoring and verification, but did not authorize commits, pushes, releases, or publication.
