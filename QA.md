# Verification — 24 September 2026

## Passed

- Production Vite build.
- Six focused catalog/cart tests: exact 10 kg boundary; over-10 kg free delivery; mixed product weights/prices; corrupt/duplicate stored lines; stock caps; inactive products; safe image URLs.
- Eight PostgreSQL-compatible integration checks against the actual migration and development seed in PGlite: anonymous access; server-computed totals; request idempotency; free-shipping threshold; unpaid preview semantics; invalid line/destination rejection; customer isolation; privilege restrictions; admin changes; stock enforcement.
- Seven built-bundle DOM scenarios in Happy DOM: home catalog; filtering/search; custom-box weight threshold; removing items; preview receipt; disabled unconnected authentication; read-only admin and empty-order state.
- All eight new WebP assets decoded and visually inspected as a hero and contact sheet. Corrected an empty gongura file before delivery.
- Source formatted with Prettier; no hosted credentials included.

## Limits and remaining checks

- Browser visual checks are **not completed** for this update. The cloud browser disallows local file URLs and could not reach the local HTTP preview. No alternate browser control or policy bypass was used. Happy DOM checks do not validate visual layout, touch behavior, real scrolling, animation smoothness or browser rendering.
- GSAP scroll behavior, desktop/mobile layouts and keyboard flow require verification on the Vercel preview. The included mobile preview wrapper uses a 390 px frame, not a physical device.
- Supabase project is **not connected** and migration is **not applied remotely**. Actual email delivery, signup confirmation, login, recovery, RLS against hosted PostgREST and authenticated admin UI still require connected-project checks.
- Payment gateway is intentionally not connected. Preview orders do not reserve inventory, accept payment, or trigger shipment. Prices/rates/products are illustrative until approved.
- Generated images are native 1254 px square and 1672 × 941 px hero, **not native 4K**.
- Countries shown in the disconnected preview are sample destinations, not verified shipping commitments. International product eligibility and real operational rates require business confirmation.

## Hosted-preview checklist

1. Inspect 390 px and 1440 px widths; no horizontal overflow; readable form labels; mobile box bar doesn't cover checkout controls.
2. Scroll home and confirm hero, floating headlines, section reveals and parallax. Pause motion and use OS reduced-motion preference.
3. Add mixed pack sizes; verify exactly 10 kg charges delivery and 10.25 kg is free; refresh and check cart persistence.
4. Check sign-up/confirmation, sign-in/out, recovery and saved-box restoration against the connected development project.
5. Save an unpaid preview order and compare server total to the customer receipt and admin list.
6. Verify an ordinary customer cannot see another customer's orders or use the admin editor.
