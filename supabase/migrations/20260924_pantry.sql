-- Non-destructive: new nr_* tables; does not alter previous storefront tables.
begin;
create table if not exists public.nr_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.nr_admins enable row level security;
create or replace function public.nr_is_admin() returns boolean language sql stable security definer set search_path = '' as $$select exists(select 1 from public.nr_admins where user_id=auth.uid())$$;
revoke all on function public.nr_is_admin() from public;
grant execute on function public.nr_is_admin() to anon,authenticated;
create table if not exists public.nr_products (
 id text primary key, name text not null check(length(name) between 1 and 100),
 category text not null check(category in ('pickles','powders','spices')),
 diet text not null check(diet in ('vegetarian','non-vegetarian')),
 image text not null check(image ~ '^(https://|/[^/])'),
 notes text not null default '' check(length(notes)<=180),
 description text not null default '' check(length(description)<=2000),
 active boolean not null default false, sort_order integer not null default 0
);
create table if not exists public.nr_variants (
 id text primary key, product_id text not null references public.nr_products(id) on delete cascade,
 weight_g integer not null check(weight_g>0 and weight_g<=10000),
 price numeric(12,2) not null check(price>0 and price<=1000000),
 stock integer not null default 0 check(stock between 0 and 100000), active boolean not null default true,
 unique(product_id,weight_g)
);
create table if not exists public.nr_shipping (
 country text primary key check(length(country)=2),name text not null,
 fee numeric(12,2) not null check(fee between 0 and 100000),active boolean not null default false
);
create table if not exists public.nr_boxes (
 user_id uuid primary key references auth.users(id) on delete cascade,
 lines jsonb not null default '[]' check(jsonb_typeof(lines)='array' and jsonb_array_length(lines)<=100),
 updated_at timestamptz not null default now()
);
create table if not exists public.nr_orders (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 request_id uuid not null,created_at timestamptz not null default now(),
 status text not null default 'preview' check(status in ('preview','reviewed','cancelled')),
 payment_status text not null default 'not_paid' check(payment_status='not_paid'),
 address jsonb not null,items jsonb not null,
 subtotal numeric(14,2) not null check(subtotal>0), shipping numeric(12,2) not null check(shipping>=0),
 total numeric(14,2) not null check(total=subtotal+shipping),weight_g integer not null check(weight_g>0),
 unique(user_id,request_id)
);
create index if not exists nr_orders_user_date on public.nr_orders(user_id,created_at desc);
create index if not exists nr_variants_product on public.nr_variants(product_id);
alter table public.nr_products enable row level security;
alter table public.nr_variants enable row level security;
alter table public.nr_shipping enable row level security;
alter table public.nr_boxes enable row level security;
alter table public.nr_orders enable row level security;
revoke all on public.nr_admins,public.nr_products,public.nr_variants,public.nr_shipping,public.nr_boxes,public.nr_orders from anon,authenticated;
grant select on public.nr_products,public.nr_variants,public.nr_shipping to anon,authenticated;
grant select,insert,update,delete on public.nr_boxes to authenticated;
grant select on public.nr_orders to authenticated;
grant update(status) on public.nr_orders to authenticated;
grant update(fee,active) on public.nr_shipping to authenticated;
create policy nr_products_read on public.nr_products for select using(active or public.nr_is_admin());
create policy nr_variants_read on public.nr_variants for select using(public.nr_is_admin() or (active and exists(select 1 from public.nr_products p where p.id=product_id and p.active)));
create policy nr_shipping_read on public.nr_shipping for select using(active or public.nr_is_admin());
create policy nr_shipping_admin on public.nr_shipping for update to authenticated using(public.nr_is_admin()) with check(public.nr_is_admin());
create policy nr_boxes_owner on public.nr_boxes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy nr_orders_read on public.nr_orders for select to authenticated using(user_id=auth.uid() or public.nr_is_admin());
create policy nr_orders_admin_status on public.nr_orders for update to authenticated using(public.nr_is_admin()) with check(public.nr_is_admin());

-- Server-owned pricing, weight and delivery; client never supplies totals.
-- Preview orders do not reserve stock or accept payment. Live fulfilment requires a gateway + transactional inventory reservation.
create or replace function public.nr_place_preview_order(p_lines jsonb,p_address jsonb,p_request_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
 uid uuid:=auth.uid(); existing uuid; order_id uuid;
 line jsonb; item record; qty integer; subtotal numeric(14,2):=0; grams integer:=0;
 delivery numeric(12,2); items jsonb:='[]'; field text;
begin
 if uid is null then raise exception 'Sign in to save a preview order'; end if;
 if p_request_id is null then raise exception 'Request ID required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text||p_request_id::text,0));
 select id into existing from public.nr_orders where user_id=uid and request_id=p_request_id;
 if existing is not null then return existing; end if;
 if p_lines is null or jsonb_typeof(p_lines)<>'array' then raise exception 'Invalid box'; end if;
 if jsonb_array_length(p_lines) not between 1 and 100 then raise exception 'Choose 1 to 100 pack sizes'; end if;
 if p_address is null or jsonb_typeof(p_address)<>'object' then raise exception 'Delivery details required'; end if;
 foreach field in array array['name','email','street','city','region','postal','country'] loop
  if length(trim(coalesce(p_address->>field,''))) not between 1 and 254 then raise exception 'Invalid delivery field: %',field; end if;
 end loop;
 if (select count(distinct x->>'id') from jsonb_array_elements(p_lines) x)<>jsonb_array_length(p_lines) then raise exception 'Duplicate pack sizes'; end if;
 select fee into delivery from public.nr_shipping where country=p_address->>'country' and active;
 if delivery is null then raise exception 'Destination is not available'; end if;
 for line in select * from jsonb_array_elements(p_lines) loop
  if jsonb_typeof(line)<>'object' or jsonb_typeof(line->'qty') is distinct from 'number' or (line->>'qty') !~ '^[0-9]+$' then raise exception 'Invalid quantity'; end if;
  qty:=(line->>'qty')::integer;
  if qty not between 1 and 99 then raise exception 'Quantity must be between 1 and 99'; end if;
  select v.*,p.name into item from public.nr_variants v join public.nr_products p on p.id=v.product_id where v.id=line->>'id' and v.active and p.active for share of v,p;
  if not found then raise exception 'A product is no longer available'; end if;
  if qty>item.stock then raise exception 'Insufficient stock for %',item.name; end if;
  subtotal:=subtotal+item.price*qty; grams:=grams+item.weight_g*qty;
  items:=items||jsonb_build_array(jsonb_build_object('id',item.id,'name',item.name,'weight_g',item.weight_g,'price',item.price,'qty',qty));
 end loop;
 if grams>10000 then delivery:=0; end if;
 insert into public.nr_orders(user_id,request_id,address,items,subtotal,shipping,total,weight_g)
 values(uid,p_request_id,jsonb_build_object('name',p_address->>'name','email',p_address->>'email','street',p_address->>'street','city',p_address->>'city','region',p_address->>'region','postal',p_address->>'postal','country',p_address->>'country'),items,subtotal,delivery,subtotal+delivery,grams) returning id into order_id;
 return order_id;
end $$;
revoke all on function public.nr_place_preview_order(jsonb,jsonb,uuid) from public;
grant execute on function public.nr_place_preview_order(jsonb,jsonb,uuid) to authenticated;

-- Atomic administrator edits. An ordinary customer cannot invoke these successfully.
create or replace function public.nr_save_product(p_id text,p_product jsonb,p_variants jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
 if not public.nr_is_admin() then raise exception 'Administrator access required'; end if;
 update public.nr_products set name=p_product->>'name',image=p_product->>'image',notes=coalesce(p_product->>'notes',''),description=coalesce(p_product->>'description',''),active=(p_product->>'active')::boolean where id=p_id;
 if not found then raise exception 'Product not found'; end if;
 for v in select * from jsonb_array_elements(p_variants) loop
  update public.nr_variants set price=(v->>'price')::numeric,stock=(v->>'stock')::integer where id=v->>'id' and product_id=p_id;
  if not found then raise exception 'Pack size does not belong to this product'; end if;
 end loop;
end $$;
revoke all on function public.nr_save_product(text,jsonb,jsonb) from public;
grant execute on function public.nr_save_product(text,jsonb,jsonb) to authenticated;
create or replace function public.nr_create_product(p_name text,p_category text,p_diet text,p_image text,p_price numeric) returns text
language plpgsql security definer set search_path = '' as $$
declare new_id text:=gen_random_uuid()::text;
begin
 if not public.nr_is_admin() then raise exception 'Administrator access required'; end if;
 insert into public.nr_products(id,name,category,diet,image) values(new_id,p_name,p_category,p_diet,p_image);
 insert into public.nr_variants(id,product_id,weight_g,price) values(new_id||'-250',new_id,250,p_price),(new_id||'-500',new_id,500,round(p_price*1.9,2)),(new_id||'-1000',new_id,1000,round(p_price*3.6,2));
 return new_id;
end $$;
revoke all on function public.nr_create_product(text,text,text,text,numeric) from public;
grant execute on function public.nr_create_product(text,text,text,text,numeric) to authenticated;
commit;
