-- Run once in a development Supabase project first.
-- Separate table avoids changing an existing NRICart product schema.
create table public.storefront_products (
  id text primary key,
  name text not null,
  category text not null check (category in ('vegetarian','non-vegetarian')),
  price numeric(10,2) not null check (price >= 0),
  weight text not null,
  image text not null,
  tag text not null default '',
  notes text not null default '',
  description text not null default '',
  heat text not null default '',
  pairing text not null default '',
  active boolean not null default false,
  sort_order integer not null default 0
);
alter table public.storefront_products enable row level security;
revoke all on public.storefront_products from anon, authenticated;
grant select on public.storefront_products to anon, authenticated;
create policy "Read active storefront products" on public.storefront_products
for select to anon, authenticated using (active = true);
-- No browser write policies. Manage catalog through trusted admin tooling.
-- Populate only verified product details, actual INR prices and approved images.
-- Never enable demo products in a production catalog automatically.
