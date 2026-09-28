# Verification — 2026-09-28

- Node syntax checks passed for app.js, core.js and admin/admin.js.
- Node 24 imported all three TypeScript Edge handlers with a mocked Deno runtime.
- Assertions passed: TR/EN selection, HTML escaping, javascript URL rejection, demo product enquiry guard, cart quantities and malformed storage, unavailable catalogue fallback, origin rejection, disabled enquiry/payment endpoints, invalid enquiry rejection, unauthorized order preparation rejection.
- Only new files under /2 are included. Existing pages and workflow are unchanged.
- Local browser preview was blocked by the remote browser's localhost network boundary. Visual inspection follows on the deployed /2 URL.
- Supabase schema/RLS, authenticated product uploads and successful enquiry persistence have NOT been executed against a database. They require the documented project setup and a verified admin account.
- Actual payment processing is NOT implemented or enabled. See setup/README.md for the remaining provider and customer-approval integration.
