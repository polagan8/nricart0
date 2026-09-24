# NRICart — the full pantry storefront

A Vite storefront for an Indian pantry business serving NRIs: pickles, turmeric, chilli powder and whole spices. This update replaces the four-pickle-only store with a custom-box shopping flow and a Supabase-backed application implementation.

## What works without a connection

- Home, searchable/filterable/sortable pantry, product details and three pack sizes.
- Custom box with quantities, stock limits, persistent local cart, product-weight calculation and destination selection.
- Free delivery **strictly above 10,000 g**. Exactly 10 kg still pays delivery. Product weight excludes packaging.
- Checkout preview and unpaid preview receipt. Demo delivery details are not saved.
- Account page layouts and a clearly labelled, read-only admin preview.
- GSAP ScrollTrigger: hero/copy parallax, large text moving with scrolling, section reveals and image parallax. Native scrolling, pause control and reduced-motion support.
- Responsive mobile navigation and a fixed box weight/review bar.

## What requires Supabase

The integration code and tested SQL migration are included. **No hosted Supabase project has been connected or migrated as part of this delivery.** Once configured:

- Email/password signup, confirmation, login, sign-out and password reset.
- Customer saved boxes and their own preview order history.
- Admin product creation and editing, pack-size prices, stock, visibility, shipping rates and preview-order review status.
- Server-calculated prices, weight and delivery. Browser-supplied totals are never trusted.
- Row-level security separates customers' boxes/orders. Admin membership is stored in a protected database table, never user-editable metadata.

Payments are deliberately a preview. Orders remain `not_paid`, are never shipped, and do not reserve inventory. A future live payment rollout needs a server-side gateway integration, verified webhooks, transactional stock reservation, verified catalog and shipping eligibility, taxes/duties, policies and operational fulfilment.

## Run

Node 22.12+ or 24; npm.

```sh
npm ci
npm run dev
npm test
npm run test:ui
npm run build
```

`npm test` runs cart/math tests plus actual PostgreSQL-compatible tests in PGlite. `npm run test:ui` builds and tests the actual bundle in Happy DOM. These are not browser screenshot or device tests.

For a file-openable demo, run `npm run preview:portable`, then open `dist/preview.html` with the adjacent `images` directory intact. `dist/mobile-preview.html` provides a 390 px frame. These files are for convenient local review; deploy the normal `dist/index.html` to Vercel.

## Connect a development Supabase project

1. Apply `supabase/migrations/20260924_pantry.sql` once through Supabase SQL Editor or the Supabase CLI migration workflow. It creates new `nr_*` tables and does not alter the old catalog tables. The old `supabase/schema.sql` is retained only as historical source; do not use it for this version.
2. Optionally run `supabase/seed-development.sql` in a **development** project. Its products, prices, stocks and destination rates are illustrative. Do not seed these as real production offers.
3. Copy `.env.example` to `.env.local`. Set the project URL and public publishable key. Legacy public anon keys are supported. Never expose a service-role or secret key in `VITE_*` variables.
4. In Supabase Auth, enable email/password authentication, configure email confirmation/SMTP, and allow your exact local and Vercel site URLs as authentication redirects. The app returns users to `/#/account`. Test confirmation and password recovery on the deployed origin.
5. Create your own account. Assign administrator access from trusted SQL, replacing the placeholder with your actual Auth user UUID:

```sql
insert into public.nr_admins(user_id)
values ('YOUR-AUTH-USER-UUID')
on conflict do nothing;
```

6. Sign out and back in. Open `/#/admin`. Review product details and stock before activation. Shipping destinations must be enabled explicitly in production.
7. Verify a real customer account cannot see another account's records and cannot call admin functions. Test sign-in, confirmation, recovery, saved boxes and server-backed preview orders against your project before launch.

### Tables

| Table         | Purpose                                                               |
| ------------- | --------------------------------------------------------------------- |
| `nr_products` | Product descriptions, images, category, diet and visibility           |
| `nr_variants` | Pack sizes in grams, INR prices and stock                             |
| `nr_shipping` | Enabled destination countries and delivery rates                      |
| `nr_boxes`    | One saved box per authenticated customer                              |
| `nr_orders`   | Unpaid preview orders, immutable price snapshots and delivery details |
| `nr_admins`   | Administrator membership managed only through trusted SQL             |

### Security choices

- Customers can only read their own orders and manage their own saved box.
- Catalog edits happen through admin-checked, atomic functions.
- Orders are created only through `nr_place_preview_order`; direct browser inserts and price/payment updates are denied.
- That function rejects unknown/disabled products, stock violations, duplicate lines, fractional quantities and unsupported destinations; computes totals; and makes duplicate requests idempotent.
- Preview status updates cannot change payment status or amounts, including from an admin browser session.
- A failed configured catalog disables ordering instead of falling back to demo prices.

## Vercel

Keep the existing GitHub/Vercel relationship. The project includes `vercel.json` with `npm run build` and output `dist`. Add the same public Supabase variables in Vercel and redeploy. Without them the deployed build is explicitly a demo. Environment variables are evaluated at build time.

## Git commands

For this delivered branch:

```sh
git fetch origin
git switch feat/full-pantry-store
npm ci
npm run dev
```

For your later edits on the same branch:

```sh
git add .
git commit -m "Refine NRICart pantry store"
git push -u origin feat/full-pantry-store
```

Review and merge the pull request when ready; the delivery does not overwrite `main` or alter your live database.

## Images and design

Eight separately generated image assets: seven individual products and a pantry-box hero. No product is cropped out of a collage. Product files are 1,254 × 1,254 px; the box is 1,672 × 941 px. These are **not native 4K**. WebP preserves their native dimensions for delivery; the generator did not return the requested 4K dimensions. Product imagery represents a concept, not verified real packaging.

See `docs/IMAGE-BRIEFS.md` for generation prompts and `QA.md` for verified checks and remaining limits.
