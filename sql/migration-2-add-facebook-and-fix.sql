-- Run this in Supabase SQL Editor to add the "Facebook name" field.
-- Your existing bookings and slots are untouched.

alter table bookings add column if not exists customer_facebook text;

drop function if exists create_booking(text, text, date, int[], jsonb, text, text, text, numeric, text);

create or replace function create_booking(
  p_ref text,
  p_court text,
  p_date date,
  p_hours int[],
  p_addons jsonb,
  p_name text,
  p_facebook text,
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
  insert into bookings (ref, court, booking_date, hours, addons, customer_name, customer_facebook, customer_email, customer_phone, total, payment_reference, status)
  values (p_ref, p_court, p_date, p_hours, p_addons, p_name, p_facebook, p_email, p_phone, p_total, p_payment_reference, 'pending_payment')
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

grant execute on function create_booking(text, text, date, int[], jsonb, text, text, text, text, numeric, text) to anon;
