-- Stock Take: jadual untuk Supabase. Tampal semua ni dalam SQL Editor dan tekan Run.
create table if not exists public.entries (
  id    uuid primary key default gen_random_uuid(),
  name  text not null check (char_length(name) between 1 and 120),
  qty   double precision not null,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  at    bigint not null,
  exp   text not null default '' check (exp = '' or exp ~ '^\d{4}-\d{2}-\d{2}$')
);

create table if not exists public.items (
  key   text primary key check (char_length(key) between 1 and 120),
  name  text not null check (char_length(name) <= 120),
  type  text not null default '' check (type in ('', 'tab', 'bottle', 'tube', 'sachet', 'box', 'ampoule')),
  brand text not null default '' check (char_length(brand) <= 80),
  per   double precision not null default 0 check (per >= 0),
  price double precision not null default 0 check (price >= 0)
);

-- Sesiapa yang ada link website boleh baca, tambah, ubah dan padam (tiada login).
alter table public.entries enable row level security;
alter table public.items   enable row level security;

drop policy if exists "link boleh guna" on public.entries;
create policy "link boleh guna" on public.entries for all to anon using (true) with check (true);
drop policy if exists "link boleh guna" on public.items;
create policy "link boleh guna" on public.items   for all to anon using (true) with check (true);

grant select, insert, update, delete on public.entries, public.items to anon;
