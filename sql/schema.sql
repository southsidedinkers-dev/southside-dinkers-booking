-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create extension if not exists pgcrypto;

-- One row per booking (the customer's whole reservation, could be multiple hours)
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  court text not null default 'Court 1',
  booking_date date not null,
  hours int[] not null,
  addons jsonb not null default '[]',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  total numeric not null,
  payment_reference text,
  status text not null default 'pending_payment', -- pending_payment | confirmed | cancelled
  created_at timestamptz not null default now()
);

-- One row per hour booked. The UNIQUE constraint below is what makes
-- double-booking impossible, even if two people click "pay" at the same second.
create table if not exists booking_slots (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings(id) on delete cascade,
  court text not null default 'Court 1',
  booking_date date not null,
  hour int not null,
  unique (court, booking_date, hour)
);

alter table bookings enable row level security;
alter table booking_slots enable row level security;

-- Anyone visiting the site can check which hours are already taken,
-- so the app can grey them out. This does NOT expose customer names/emails.
drop policy if exists "public can read booking_slots" on booking_slots;
create policy "public can read booking_slots"
  on booking_slots for select
  to anon
  using (true);

-- Customers never write to the tables directly. All booking creation
-- goes through this function, which checks availability and inserts
-- everything as one all-or-nothing transaction.
create or replace function create_booking(
  p_ref text,
  p_court text,
  p_date date,
  p_hours int[],
  p_addons jsonb,
  p_name text,
  p_email text,
  p_phone text,
  p_total numeric,
  p_payment_reference text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  h int;
begin
  insert into bookings (ref, court, booking_date, hours, addons, customer_name, customer_email, customer_phone, total, payment_reference, status)
  values (p_ref, p_court, p_date, p_hours, p_addons, p_name, p_email, p_phone, p_total, p_payment_reference, 'pending_payment')
  returning id into v_booking_id;

  foreach h in array p_hours loop
    insert into booking_slots (booking_id, court, booking_date, hour)
    values (v_booking_id, p_court, p_date, h);
  end loop;

  return v_booking_id;
exception when unique_violation then
  raise exception 'One or more of your selected hours were just taken by someone else. Please pick different times.';
end;
$$;

grant execute on function create_booking to anon;

-- Handy view for you (the owner) to check in the Table Editor.
-- Go to Supabase -> Table Editor -> bookings to see every reservation,
-- and flip "status" from pending_payment to confirmed once you verify
-- the GCash/Maya payment yourself.
