# The Craft Corner

## Project overview

This project is a Next.js storefront and staff/admin portal deployed to Cloudflare Pages. It includes a product catalog, staff authentication, admin inventory tools, and local database-backed helpers.

## Cloudflare Pages deployment guardrails

These rules are mandatory for this project and should be followed before every deploy.

### 1. Use `node:` imports for Node built-ins

When code runs in Cloudflare Pages/Workers, do not use bare Node imports such as:

- `import fs from 'fs'`
- `import path from 'path'`
- `import crypto from 'crypto'`

Use the Node-prefixed form instead:

- `import fs from 'node:fs'`
- `import path from 'node:path'`
- `import crypto from 'node:crypto'`

This prevents runtime resolution errors that only appear after deployment.

### 2. Keep the Cloudflare compatibility date current

The project is configured to use a recent compatibility date and Node compatibility mode:

- `compatibility_date: "2024-09-23"`
- `compatibility_flags: ["nodejs_compat"]`

Do not lower these values without verifying the deployment behavior.

### 3. Do not assume filesystem APIs are available

Cloudflare Pages Functions do not support all Node filesystem methods. In particular, calls such as `fs.mkdirSync()` may throw at runtime in the worker environment.

If server code needs a database path, guard the filesystem access and fall back to an in-memory database when the runtime does not support it.

This project should never rely on writing to a local disk in production Cloudflare Pages code.

### 4. Run the Cloudflare preview before deploy

Use the project safety-net command before shipping changes:

```bash
npm run cf:check
```

This command does the same kind of validation that previously caught the Cloudflare-only failure: it builds the Next.js app and runs the Wrangler Pages preview with the correct compatibility flags.

Important: this preview requires a local Node 22 environment. On this machine, Wrangler currently fails under Node 20.12.0, so the preview step must be run in a Node 22 environment or in Cloudflare itself. The deployed Cloudflare runtime remains the final confirmation point when local Wrangler is unavailable.

### 5. Match the runtime environment closely

Cloudflare Wrangler is stricter than local Next.js builds. The local environment should be kept close to the runtime target:

- use a recent Node version (Node 22 is required for local Wrangler preview)
- prefer the same compatibility date used in the project config
- validate with the Cloudflare preview, not only with `next build`
- when local preview is blocked by environment constraints, validate on the deployed Cloudflare runtime instead

## Security and credential rules

### 1. Never hardcode usernames or passwords

Do not commit default usernames, passwords, or credentials into source files, seed data, or frontend code.

Use Cloudflare environment variables or secure managed secrets instead.

### 2. Keep server auth on the server

Authentication and password verification should happen in server-side code and never in browser-rendered client code that could leak secrets.

### 3. Prefer env-managed admin credentials

Admin access should be controlled by environment-managed credentials, not by legacy hardcoded names or fallback values.

## Data persistence guidance

Cloudflare Pages storage is not equivalent to a normal local filesystem. The current app uses SQLite for local development and safe in-memory fallback behavior under Cloudflare. For durable production storage, prefer Cloudflare D1 or another Cloudflare-native database.

## Deployment checklist

Before pushing a change that affects auth, database access, or deployment config, confirm all of the following:

- `npm run build` succeeds
- `npm run cf:check` succeeds
- all `node:` imports are used where required
- any filesystem access is guarded
- no credentials are hardcoded in the repo
- runtime-sensitive code is verified under the Cloudflare Pages preview path

## Typical failure pattern to avoid

This project previously hit a deployment-only error because the code was locally valid but not Cloudflare-compatible:

- plain Node built-ins without `node:` prefix
- missing `nodejs_compat`
- stale `compatibility_date`
- direct filesystem writes in a Cloudflare worker runtime

The fix is to maintain the compatibility settings and use the Cloudflare preflight check before deployment.
