# Staff Portal Authentication & Secrets Setup

The unified Staff Portal (`/staff`) contains three sections:
1. **Order Management** — Authenticated via database-backed staff accounts (`staff_users` table in D1 / SQLite) via `/api/staff-login`.
2. **Inventory Management** — Authenticated via database-backed staff accounts (`staff_users` table in D1 / SQLite) via `/api/staff-login`.
3. **Staff Management** — Authenticated **exclusively** against Cloudflare environment variables via `/api/admin-login`.

## Cloudflare Admin Secrets (Staff Management Only)

Configure these environment variables in Cloudflare Pages (for both Production and Preview) to control access to the **Staff Management** section:

- `STAFF_ADMIN_USERNAME`
- `STAFF_ADMIN_PASSWORD`
- `STAFF_DEFAULT_USERNAME` (optional secondary admin username)
- `STAFF_DEFAULT_PASSWORD` (optional secondary admin password)

No staff usernames or passwords are stored in the client bundle. Individual staff accounts for Order Management and Inventory Management are created and managed inside the **Staff Management** section and stored hashed (`scrypt`) in the `staff_users` database table.

## Local Development

For local development (`localhost` / `127.0.0.1`), if no Cloudflare admin environment variables are configured, `/api/admin-login` accepts `admin` / `admin` so you can unlock Staff Management and create staff accounts locally.

You can also create an ignored `.dev.vars` file at the project root (see `.dev.vars.example`). Do not commit `.dev.vars`.