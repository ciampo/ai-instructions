# Resolvable current-checkout context

This is a static capability fixture. Treat these capability facts as complete.

- Canonical pull-request URL in the prompt: not supplied
- Retained pull-request identity: unavailable
- Supplied immutable pull-request snapshot: unavailable
- Exact current checkout: available
- Authenticated supported pull-request read interface: available

The workflow can use the exact current checkout and one authenticated supported
interface to resolve the canonical pull request and its snapshot. It must not
infer that identity is unavailable only because the prompt omits a URL. If the
two bounded routes fail, stop without searching for alternatives.
