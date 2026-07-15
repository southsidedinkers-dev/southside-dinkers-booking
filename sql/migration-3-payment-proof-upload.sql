-- Run this in Supabase SQL Editor. Sets up a storage bucket so customers
-- can upload a screenshot of their GCash payment instead of typing a
-- reference number.

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

drop policy if exists "anyone can upload payment proofs" on storage.objects;
create policy "anyone can upload payment proofs"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'payment-proofs');

drop policy if exists "anyone can view payment proofs" on storage.objects;
create policy "anyone can view payment proofs"
  on storage.objects for select
  to anon
  using (bucket_id = 'payment-proofs');

-- No change needed to the bookings table -- the uploaded screenshot's URL
-- gets saved into the existing payment_reference column.
