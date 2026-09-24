# NRICart — A little closer to home

A new editorial storefront built for your Git → Vercel workflow, with an optional Supabase product catalog. This is a separate rebuild, not an overwrite of an existing repository.

## Run

Use Node 22.12+ (or a compatible newer LTS).

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

The source is deliberately small: `index.html`, `src/style.css`, `src/main.js`, and `src/catalog.js`. Vite builds a static `dist/` folder. No runtime framework or animation CDN is required. Six optimized WebP assets are local. Fonts currently load from Google Fonts, with system fallbacks.

## Included

- Editorial homepage with food photography, story and serving suggestions.
- Pointer-responsive hero depth (CSS perspective), layered scroll parallax, staggered product entrances, serving-image parallax, a scroll-linked flavour strip, page progress, hover zoom, motion pause and reduced-motion support. This is not a rotatable WebGL product model.
- Vegetarian/non-vegetarian filters and accessible native product dialogs.
- Device-local persistent bag, quantity controls, removal and price totals.
- WhatsApp bag enquiry using the public NRICart contact on nricart.com. No message is sent until the visitor acts in WhatsApp.
- Optional read-only Supabase product loading; empty/error states.
- Vercel configuration, example environment variables and isolated SQL schema.

## Preview versus live commerce

The four default products, prices, serving descriptions and generated images are demonstration content. They do not establish actual ingredients, preparation methods, stock, certification, shelf life or packaging. The interface labels preview pricing. Replace the imagery with approved real product photographs before a transactional launch. No fake reviews, sales counts or shipping promises are included.

The bag ends in an enquiry, not a checkout or payment. No order is stored, no inventory is reserved, and no payment provider is connected. Adding paid checkout requires server-side price lookup, inventory validation, payment confirmation/webhooks, order storage and business policies. Never trust a browser cart's totals for payment.

## Connect Supabase

1. Review `supabase/schema.sql` and run it once in a development Supabase project. It creates a separate `storefront_products` table; it does not migrate your existing catalog.
2. Add verified product rows. Prices are INR amounts (not paise). Set `active=true` only on approved rows. Images can be site-relative `/images/mango.webp` or trusted HTTPS URLs.
3. Copy `.env.example` to `.env.local`; add your project URL and public **legacy anon key**. Never put a service-role key, secret key or database password in a VITE variable.
4. Set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel and redeploy. Vite embeds public values at build time.
5. Confirm the deployed catalog is correct. The browser has SELECT access to active products only; it has no insert/update/delete policy.

Without credentials the labelled demo works. If configured catalog loading fails, an explicit message identifies the preview fallback. A valid empty catalog is displayed as empty.

## Git and Vercel

For an existing repository, create a new branch and integrate these files deliberately. Do not overwrite server code, migrations or secrets from your current project.

```sh
git switch -c redesign/nricart-editorial
# Copy this project's source into the intended frontend directory, then:
npm ci
npm test
npm run build
git add .
git commit -m "Build NRICart editorial storefront"
git push -u origin redesign/nricart-editorial
```

In Vercel use the **Vite** preset, build command `npm run build`, output `dist`. If this lives in a subdirectory, set that directory as the Vercel project root. Review its branch preview before merging into the production branch.

This repository contains the new storefront. Vercel deployment and the live Supabase connection are separate setup steps; no production database changes are performed by this code.

## Research and design rationale

Reviewed the available NRICart conversation context and nricart.com. The latter showed unrelated template content; this rebuild uses the home/Indian pantry brand idea without reproducing those sections. nricart.vercel.app could not be retrieved through search. Instagram returned a 429 response and the retrieved X profile exposed no usable posts; these platforms were not represented as completed visual audits.

References:
- https://nricart.com/ — public brand and contact context.
- https://flybyjing.com/ — food-first storytelling and flavour-led merchandising.
- https://www.diasporaco.com/ — origin and pantry identity.
- https://www.reddit.com/r/web_design/comments/qhk7pt/ — contrasting opinions on 3D commerce and usability; anecdotal, not conversion evidence.
- https://www.reddit.com/r/web_design/comments/1uipon6/in_browsing_through_some_awardwinning_sites_my/ — discussion of animation fatigue.
- https://vercel.com/docs/frameworks/frontend/vite
- https://supabase.com/docs/guides/api/securing-your-api

Chosen direction: oxblood and pale yellow, large sans-serif headlines with italic serif accents, food texture and varied editorial proportions. Motion is progressive enhancement: browsing works without it. No scroll hijacking, startup loading sequence, fake trust signals or decorative cursor replacement.
