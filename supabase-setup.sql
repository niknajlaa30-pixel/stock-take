-- Stock Take: database untuk website. Tampal SEMUA ni dalam Supabase → SQL Editor, kemudian tekan Run.
-- Satu jadual "docs" menyimpan semua: kiraan, maklumat ubat, kiraan dipadam, dan maklumat accountant.

create table if not exists public.docs (
  collection text not null check (collection in ('entries', 'items', 'deleted', 'settings')),
  id         text not null check (char_length(id) between 1 and 200),
  data       jsonb not null default '{}'::jsonb check (pg_column_size(data) < 20000),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

-- Tiada login: sesiapa yang ada link website boleh baca, tambah dan ubah.
alter table public.docs enable row level security;

drop policy if exists "baca"   on public.docs;
drop policy if exists "tambah" on public.docs;
drop policy if exists "ubah"   on public.docs;
drop policy if exists "padam"  on public.docs;

create policy "baca"   on public.docs for select to anon using (true);
create policy "tambah" on public.docs for insert to anon with check (true);
-- Rekod "kiraan yang dipadam" tak boleh diubah atau dipadam dari website, supaya jejak siapa padam apa kekal.
create policy "ubah"   on public.docs for update to anon using (collection <> 'deleted') with check (collection <> 'deleted');
create policy "padam"  on public.docs for delete to anon using (collection <> 'deleted');

grant select, insert, update, delete on public.docs to anon;
