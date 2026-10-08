# Staff Login Secrets

Staff and inventory-admin logins are verified by the Cloudflare Pages Function at `/api/staff-login` and `/api/admin-login`. The client bundle contains no staff usernames or passwords.

Configure these values as **environment variables** in Cloudflare Pages for both Production and Preview. Use newly rotated usernames and strong, unique passwords; the old credentials were present in client code and must no longer be used.

## Staff account secrets

- `STAFF_ANNA_USERNAME`
- `STAFF_ANNA_PASSWORD`
- `STAFF_KAITLYN_USERNAME`
- `STAFF_KAITLYN_PASSWORD`
- `STAFF_NICOLE_USERNAME`
- `STAFF_NICOLE_PASSWORD`

## Admin account secrets

- `STAFF_ADMIN_USERNAME`
- `STAFF_ADMIN_PASSWORD`
- `STAFF_DEFAULT_USERNAME`
- `STAFF_DEFAULT_PASSWORD`

These are the values used by the admin access flow. If either admin pair is missing, `/admin` login will fail with a 401 even though the app code is correct.

For local development only, the app accepts `admin` / `admin` when `NODE_ENV` is `development` and no Cloudflare secret is configured. Production must still use Cloudflare-managed secrets.

For local Pages development, create an ignored `.dev.vars` file at the project root with the same variable names. Do not commit that file or share its values.