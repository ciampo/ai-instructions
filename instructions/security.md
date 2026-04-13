# Security

Baseline security practices for application code. Not an exhaustive security policy -- a set of principles AI agents must follow.

## Cross-Site Scripting (XSS)

- **[RULE]** Never use `dangerouslySetInnerHTML` (React) or equivalent raw HTML injection without explicit sanitization. If it must be used, sanitize with a trusted library (e.g., DOMPurify) and document why raw HTML is necessary.
- **[RULE]** Never construct HTML strings by concatenating user input. Use DOM APIs or framework templating that escapes by default.
- **[STRONG]** Treat all user-supplied data as untrusted: form inputs, URL parameters, API responses from third parties, database content that originated from user input.

## Content Security

- **[STRONG]** Use `rel="noopener noreferrer"` on external links opened with `target="_blank"`.
- **[PREFER]** Avoid inline event handlers (`onclick="..."`) and inline styles injected from user data. These conflict with strict CSP policies.
- **[STRONG]** Do not embed secrets, API keys, or credentials in client-side code. Keep secrets server-side only (server-only environment variables or a secret management service). Only explicitly public configuration values may be exposed to client code. Use server-side proxies for secret-backed operations.

## Dependencies

- **[STRONG]** Run the project's dependency audit (`npm audit`, `pnpm audit`) after adding or updating packages. Address critical and high-severity vulnerabilities before merging.
- **[PREFER]** Prefer well-maintained packages with active security response. Check last publish date, open issues, and known CVEs before adding a new dependency.

## Server-Side Considerations

- **[RULE]** Validate and sanitize all input on the server side, regardless of client-side validation.
- **[STRONG]** Use parameterized queries / prepared statements for database operations. Never interpolate user input into SQL or query strings.
- **[STRONG]** Apply the principle of least privilege: API endpoints should only expose the data and actions the caller is authorized to use.

## Secrets and Credentials

- **[RULE]** Never commit secrets, tokens, or credentials to the repository. Use `.env` files (gitignored) or a secret management service.
- **[RULE]** If a secret is accidentally committed, rotate it immediately. Removing it from git history alone is not sufficient.
