# Staff Login Secrets

Staff and inventory-admin logins are verified by the Cloudflare Pages Function at `/api/staff-login`. The client bundle contains no staff usernames or passwords.

Configure these six values as **secrets** in Cloudflare Pages for both Production and Preview. Use newly rotated usernames and strong, unique passwords; the old credentials were present in client code and must no longer be used.

- `STAFF_ANNA_USERNAME`
- `STAFF_ANNA_PASSWORD`
- `STAFF_KAITLYN_USERNAME`
- `STAFF_KAITLYN_PASSWORD`
- `STAFF_NICOLE_USERNAME`
- `STAFF_NICOLE_PASSWORD`

For local Pages development, create an ignored `.dev.vars` file at the project root with the same variable names. Do not commit that file or share its values.