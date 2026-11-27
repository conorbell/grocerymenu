-- Grocery Menu: household chat (messages + "seen" receipts).
-- Paste into Supabase → SQL Editor → New query → Run. Safe to re-run.

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  sender_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_created_at_idx on public.messages (created_at desc);

-- When each person last read the chat (drives unread badges and "Seen").
create table if not exists public.chat_reads (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now()
);

alter table public.messages enable row level security;
alter table public.chat_reads enable row level security;

-- Household chat: everyone logged in can read it; you can only send as
-- yourself and only delete your own messages.
drop policy if exists "household can read messages" on public.messages;
create policy "household can read messages" on public.messages
  for select to authenticated using (true);

drop policy if exists "send as yourself" on public.messages;
create policy "send as yourself" on public.messages
  for insert to authenticated with check (sender_id = (select auth.uid()));

drop policy if exists "delete your own messages" on public.messages;
create policy "delete your own messages" on public.messages
  for delete to authenticated using (sender_id = (select auth.uid()));

drop policy if exists "household can see reads" on public.chat_reads;
create policy "household can see reads" on public.chat_reads
  for select to authenticated using (true);

drop policy if exists "mark your own reads" on public.chat_reads;
create policy "mark your own reads" on public.chat_reads
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "update your own reads" on public.chat_reads;
create policy "update your own reads" on public.chat_reads
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, delete on public.messages to authenticated;
grant select, insert, update on public.chat_reads to authenticated;
revoke all on public.messages, public.chat_reads from anon;

-- Live delivery.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.chat_reads;
exception when duplicate_object then null;
end $$;

-- Deletes need the full old row so the other phone knows which message went.
alter table public.messages replica identity full;
