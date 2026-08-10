-- Run this entire file once in Supabase Dashboard > SQL Editor.
-- Participant access intentionally uses Staff ID only, as requested.

create table if not exists public.karaoke_registrations (
  staff_id text primary key check (staff_id ~ '^[A-Z0-9_-]{3,20}$'),
  full_name text not null check (char_length(full_name) between 1 and 80),
  attendance text not null check (attendance in ('Hadir', 'Tidak Hadir')),
  preferred_date date not null,
  preferred_time time not null,
  preferred_venue text not null check (char_length(preferred_venue) between 1 and 120),
  songs jsonb not null default '[]'::jsonb check (jsonb_typeof(songs) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.karaoke_registrations enable row level security;
revoke all on table public.karaoke_registrations from anon, authenticated;

create or replace function public.get_karaoke_registration(p_staff_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff_id text := upper(trim(p_staff_id));
  v_result jsonb;
begin
  if v_staff_id !~ '^[A-Z0-9_-]{3,20}$' then
    raise exception 'Invalid Staff ID';
  end if;

  select jsonb_build_object(
    'staff_id', r.staff_id,
    'full_name', r.full_name,
    'attendance', r.attendance,
    'preferred_date', r.preferred_date,
    'preferred_time', r.preferred_time,
    'preferred_venue', r.preferred_venue,
    'songs', r.songs,
    'created_at', r.created_at,
    'updated_at', r.updated_at
  ) into v_result
  from public.karaoke_registrations r
  where r.staff_id = v_staff_id;

  return v_result;
end;
$$;

create or replace function public.save_karaoke_registration(
  p_staff_id text,
  p_full_name text,
  p_attendance text,
  p_preferred_date date,
  p_preferred_time time,
  p_preferred_venue text,
  p_songs jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff_id text := upper(trim(p_staff_id));
  v_result jsonb;
begin
  if v_staff_id !~ '^[A-Z0-9_-]{3,20}$' then raise exception 'Invalid Staff ID'; end if;
  if char_length(trim(p_full_name)) not between 1 and 80 then raise exception 'Invalid name'; end if;
  if p_attendance not in ('Hadir', 'Tidak Hadir') then raise exception 'Invalid attendance'; end if;
  if char_length(trim(p_preferred_venue)) not between 1 and 120 then raise exception 'Invalid venue'; end if;
  if jsonb_typeof(p_songs) <> 'array' or jsonb_array_length(p_songs) > 20 then raise exception 'Invalid song list'; end if;

  insert into public.karaoke_registrations as r
    (staff_id, full_name, attendance, preferred_date, preferred_time, preferred_venue, songs)
  values
    (v_staff_id, trim(p_full_name), p_attendance, p_preferred_date, p_preferred_time, trim(p_preferred_venue), p_songs)
  on conflict (staff_id) do update set
    full_name = excluded.full_name,
    attendance = excluded.attendance,
    preferred_date = excluded.preferred_date,
    preferred_time = excluded.preferred_time,
    preferred_venue = excluded.preferred_venue,
    songs = excluded.songs,
    updated_at = now();

  select to_jsonb(r) into v_result
  from public.karaoke_registrations r
  where r.staff_id = v_staff_id;
  return v_result;
end;
$$;

revoke all on function public.get_karaoke_registration(text) from public;
revoke all on function public.save_karaoke_registration(text, text, text, date, time, text, jsonb) from public;
grant execute on function public.get_karaoke_registration(text) to anon, authenticated;
grant execute on function public.save_karaoke_registration(text, text, text, date, time, text, jsonb) to anon, authenticated;
