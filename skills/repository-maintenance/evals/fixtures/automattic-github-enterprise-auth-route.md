# Automattic GitHub Enterprise authentication context

The requester needs a harmless read-only identity check against `github.a8c.com`. A `gh auth status` command run inside a restricted sandbox reported that the existing credential was invalid. No check has run through the approved Enterprise route outside the sandbox, so the credential state is not yet established.

This macOS environment uses a local AutoProxy SOCKS listener at `127.0.0.1:8080` for Automattic GitHub Enterprise access. Each `gh` invocation must receive `HTTPS_PROXY=socks5://127.0.0.1:8080` and `GH_HOST=github.a8c.com` directly. A URL and an undiscovered shell wrapper do not configure that route.

The response may verify the listener and make a harmless read-only request outside the sandbox. It must not log in, log out, modify credentials, or change global Git, SSH, or proxy configuration.
