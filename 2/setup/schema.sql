-- AURA /2: additive, isolated schema. Run once in Supabase SQL Editor.
-- Does NOT modify legacy aura_products/categories/project tables or their RLS.
begin;
create table if not exists public.aura_v2_admins(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.aura_v2_admins enable row level security;
create or replace function public.aura_v2_is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.aura_v2_admins where user_id=auth.uid())$$;
revoke all on function public.aura_v2_is_admin() from public;
grant execute on function public.aura_v2_is_admin() to authenticated;
create table if not exists public.aura_v2_categories(id uuid primary key default gen_random_uuid(),name text not null,name_en text not null default '',slug text unique not null,sort_order integer not null default 0);
create table if not exists public.aura_v2_products(
 id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 title text not null,title_en text not null default '',slug text unique not null check(slug ~ '^[a-z0-9-]{1,100}$'),
 description text not null default '',description_en text not null default '',category_id uuid references public.aura_v2_categories(id) on delete set null,
 status text not null default 'draft' check(status in ('draft','published')),sales_mode text not null default 'quote' check(sales_mode in ('quote','buy')),
 price numeric(12,2) check(price>=0),currency text not null default 'TRY' check(currency in ('TRY','EUR','USD','GBP')),
 image_url text,images jsonb not null default '[]',images_360 jsonb not null default '[]',custom_fields jsonb not null default '[]',
 frame_material text not null default '',frame_material_en text not null default '',upholstery text not null default '',upholstery_en text not null default '',
 leg_material text not null default '',leg_material_en text not null default '',dimensions text not null default '',technique text not null default '',technique_en text not null default '',lead_time text not null default '',lead_time_en text not null default '',
 is_featured boolean not null default false,in_stock boolean not null default false,sort_order integer not null default 0,
 check(jsonb_typeof(images)='array' and jsonb_typeof(images_360)='array' and jsonb_typeof(custom_fields)='array')
);
create table if not exists public.aura_v2_inquiries(
 id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),
 idempotency_key uuid not null unique,reference text not null unique,
 kind text not null check(kind in ('quote','project')),name text not null,email text not null,phone text not null default '',country text not null,city text not null,company text not null default '',budget text not null default '',deadline text not null default '',message text not null,locale text not null check(locale in ('tr','en')),consent_at timestamptz not null default now(),privacy_version text not null default 'preview-2026-09',
 items jsonb not null default '[]',status text not null default 'new' check(status in ('new','discussing','quoted','closed')),internal_note text not null default ''
);
create table if not exists public.aura_v2_orders(
 id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),inquiry_id uuid not null references public.aura_v2_inquiries(id),
 items jsonb not null,currency text not null check(currency in ('TRY','EUR','USD','GBP')),subtotal_minor bigint not null check(subtotal_minor>=0),shipping_minor bigint not null check(shipping_minor>=0),tax_minor bigint not null check(tax_minor>=0),total_minor bigint not null check(total_minor>0),
 status text not null default 'awaiting_approval' check(status in ('awaiting_approval','awaiting_payment','paid','production','shipped','completed','cancelled')),
 terms_snapshot text not null,delivery_scope text not null,customer_approved_at timestamptz,payment_reference text unique,
 check(total_minor=subtotal_minor+shipping_minor+tax_minor)
);
create table if not exists public.aura_v2_rate_limits(key text primary key,hits integer not null,expires_at timestamptz not null);
create table if not exists public.aura_v2_payment_events(event_id text primary key,order_id uuid not null references public.aura_v2_orders(id),created_at timestamptz not null default now());
-- Restrict every table explicitly, including future security-definer helper access.
do $$declare tbl text;begin foreach tbl in array array['aura_v2_categories','aura_v2_products','aura_v2_inquiries','aura_v2_orders','aura_v2_rate_limits','aura_v2_payment_events'] loop
 execute format('alter table public.%I enable row level security',tbl);
 execute format('revoke all on public.%I from anon, authenticated',tbl);
 execute format('grant all on public.%I to service_role',tbl);
end loop;end$$;
grant select on public.aura_v2_categories,public.aura_v2_products to anon,authenticated;
grant insert,update,delete on public.aura_v2_categories,public.aura_v2_products to authenticated;
grant select,update,delete on public.aura_v2_inquiries to authenticated;
grant select on public.aura_v2_orders to authenticated;
drop policy if exists aura_v2_category_read on public.aura_v2_categories;
create policy aura_v2_category_read on public.aura_v2_categories for select to anon,authenticated using(true);
drop policy if exists aura_v2_product_public on public.aura_v2_products;
create policy aura_v2_product_public on public.aura_v2_products for select to anon,authenticated using(status='published');
do $$declare tbl text;begin foreach tbl in array array['aura_v2_categories','aura_v2_products','aura_v2_inquiries','aura_v2_orders'] loop
 execute format('drop policy if exists aura_v2_admin_access on public.%I',tbl);
 execute format('create policy aura_v2_admin_access on public.%I for all to authenticated using(public.aura_v2_is_admin()) with check(public.aura_v2_is_admin())',tbl);
end loop;end$$;
create or replace function public.aura_v2_rate_limit(p_key text) returns boolean language plpgsql security definer set search_path=public as $$declare n int;begin
 delete from public.aura_v2_rate_limits where expires_at<now();
 insert into public.aura_v2_rate_limits(key,hits,expires_at) values(p_key,1,now()+interval '1 hour') on conflict(key) do update set hits=aura_v2_rate_limits.hits+1 returning hits into n;
 return n<=5;
end$$;
revoke all on function public.aura_v2_rate_limit(text) from public,anon,authenticated;
grant execute on function public.aura_v2_rate_limit(text) to service_role;
-- Payment events are reconciled against the immutable, server-calculated order total.
create or replace function public.aura_v2_record_payment(p_event text,p_order uuid,p_amount bigint,p_currency text,p_reference text) returns boolean language plpgsql security definer set search_path=public as $$declare o public.aura_v2_orders;begin
 select * into o from public.aura_v2_orders where id=p_order for update;
 if not found or o.total_minor<>p_amount or o.currency<>p_currency then raise exception 'Payment mismatch';end if;
 if exists(select 1 from public.aura_v2_payment_events where event_id=p_event) then return true;end if;
 if o.status<>'awaiting_payment' or o.customer_approved_at is null then raise exception 'Order not payable';end if;
 insert into public.aura_v2_payment_events(event_id,order_id) values(p_event,p_order);
 update public.aura_v2_orders set status='paid',payment_reference=p_reference where id=p_order;
 return true;
end$$;
revoke all on function public.aura_v2_record_payment(text,uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.aura_v2_record_payment(text,uuid,bigint,text,text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('aura-v2-images','aura-v2-images',true,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
drop policy if exists aura_v2_images_read on storage.objects;
create policy aura_v2_images_read on storage.objects for select to anon,authenticated using(bucket_id='aura-v2-images');
drop policy if exists aura_v2_images_admin on storage.objects;
create policy aura_v2_images_admin on storage.objects for all to authenticated using(bucket_id='aura-v2-images' and public.aura_v2_is_admin()) with check(bucket_id='aura-v2-images' and public.aura_v2_is_admin());
insert into public.aura_v2_categories(name,name_en,slug,sort_order) values('Oturma','Seating','oturma',1),('Masa & sehpa','Tables','masa-sehpa',2),('Dolap & panel','Cabinetry & panels','dolap-panel',3),('Yatak odası','Bedroom','yatak-odasi',4),('Aksesuar','Accessories','aksesuar',5) on conflict(slug) do nothing;
commit;
-- Explicitly enrol an EXISTING, trusted Supabase Auth user AFTER checking its identity:
-- insert into public.aura_v2_admins(user_id) values ('REPLACE-WITH-VERIFIED-USER-UUID');
-- There is intentionally no automatic admin enrolment and no default password.
