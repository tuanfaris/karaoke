-- Run this file once in Supabase Dashboard > SQL Editor.
-- It exposes anonymous totals and grouped suggestions only; no names or Staff IDs.

create or replace function public.get_karaoke_public_summary()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'total_registered', count(*),
    'attending', count(*) filter (where attendance = 'Hadir'),
    'not_attending', count(*) filter (where attendance = 'Tidak Hadir'),
    'dates', coalesce((select jsonb_agg(to_jsonb(d) order by d.votes desc, d.value) from (select preferred_date::text as value, count(*) as votes from public.karaoke_registrations group by preferred_date order by votes desc, value limit 5) d), '[]'::jsonb),
    'times', coalesce((select jsonb_agg(to_jsonb(t) order by t.votes desc, t.value) from (select to_char(preferred_time, 'HH24:MI') as value, count(*) as votes from public.karaoke_registrations group by preferred_time order by votes desc, value limit 5) t), '[]'::jsonb),
    'venues', coalesce((select jsonb_agg(to_jsonb(v) order by v.votes desc, v.value) from (select preferred_venue as value, count(*) as votes from public.karaoke_registrations group by preferred_venue order by votes desc, value limit 5) v), '[]'::jsonb)
  )
  from public.karaoke_registrations;
$$;

revoke all on function public.get_karaoke_public_summary() from public;
grant execute on function public.get_karaoke_public_summary() to anon, authenticated;
