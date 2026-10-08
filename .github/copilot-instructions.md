# Copilot project instructions

## Required deployment safety rules

- Always use `node:` imports for Node built-ins in Cloudflare runtime code.
- Keep the Cloudflare Pages compatibility date current and do not lower it without a reason.
- Keep `nodejs_compat` enabled.
- Before release, run the Cloudflare preview check: `npm run cf:check`.
- If local Wrangler preview is unavailable because the machine is not on Node 22, note the environment constraint and validate in the deployed Cloudflare runtime instead.
- Do not assume a writable local filesystem exists in Cloudflare Pages Functions.
- If filesystem access is needed, guard it and fall back safely instead of crashing the worker.
- Do not hardcode usernames, passwords, or admin credentials in source code or frontend bundles.
- Prefer Cloudflare-managed secrets and environment variables.
- Treat `next build` and `npm run cf:check` as separate verification steps.

## Preferred patterns

- Use `node:fs`, `node:path`, `node:crypto` instead of bare `fs`, `path`, and `crypto` imports.
- Use `:memory:` for SQLite fallback when runtime file access is not available.
- Prefer Cloudflare-native persistence (for example D1) for production data.
- Keep local validation aligned with Cloudflare Pages runtime constraints.
- Node 22 is required for local Wrangler preview; Node 20 is not sufficient for that step.

## Security reminders

- Never leak staff or admin credentials in UI code, logs, or seeded data.
- Keep authentication on the server and validate secrets in server-side handlers.
- Use environment variables for credentials and avoid storing them in code or version control.

## Reliability reminder

The most common source of deployment-only build failures in this project is a runtime mismatch between local Node behavior and Cloudflare Pages. Validate with the Cloudflare preview command before pushing code that affects runtime behavior.
