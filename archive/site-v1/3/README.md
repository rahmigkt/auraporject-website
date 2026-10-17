# AURA Store V3

Furni-style, shopping-first preview at /3/. Leaves / and /2 unchanged.

- TR/EN shop, search/category/sort, product pages, working local cart, quantities, removal, subtotal by currency, order enquiry step.
- Reads the published aura_v2 catalogue and reuses its admin/backend setup. Manage actual products at /2/admin/ after completing /2/setup/README.md.
- On catalogue failure, three Furni samples appear with explicit illustrative prices. They can be put in the cart to test the experience. The checkout step blocks samples and unavailable IDs; no customer data, orders or payments are taken for them.
- Cart stores IDs and quantities only. Product titles/prices are re-read from the catalogue. Currency totals are kept separate. Delivery/tax scope is not invented.
- Actual products lead to availability/delivery enquiries using submit-inquiry. This endpoint still requires the Supabase setup. Payment is disabled; no PSP integration is claimed.
- Images are shared from /2/assets; keep that folder deployed. Header/footer attribution retained. Furni by Untree.co, CC BY 3.0. Images are clearly labelled samples; replace with owned photography for launch.
- Noindex preview. No newsletter, fake reviews, made-up discounts, stock assertions or free-shipping claims.
